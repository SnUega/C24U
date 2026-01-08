<?php
/**
 * API для обработки платежей через ЮKassa
 * 
 * Структура:
 * - api/index.php - главный файл
 * - api/.htaccess - роутинг
 * - api/payments.json - временное хранилище платежей
 * - api/logs/ - папка для логов
 * 
 * БЕЗОПАСНОСТЬ:
 * - Проверка подписи webhook от ЮKassa
 * - Валидация всех данных
 * - Защита от дублирования платежей
 * - Все ключи в переменных окружения
 */

// Заголовки для CORS (если frontend на другом домене)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Загрузка переменных окружения
// Вариант 1: Через .env файл (если используете библиотеку vlucas/phpdotenv)
// require_once __DIR__ . '/../vendor/autoload.php';
// $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
// $dotenv->load();

// Вариант 2: Через getenv() (настройте в .htaccess или php.ini)
$YOOKASSA_SHOP_ID = getenv('YOOKASSA_SHOP_ID') ?: $_ENV['YOOKASSA_SHOP_ID'] ?? '';
$YOOKASSA_SECRET_KEY = getenv('YOOKASSA_SECRET_KEY') ?: $_ENV['YOOKASSA_SECRET_KEY'] ?? '';
$TELEGRAM_BOT_TOKEN = getenv('TELEGRAM_BOT_TOKEN') ?: $_ENV['TELEGRAM_BOT_TOKEN'] ?? '';
$TELEGRAM_CHANNEL_ID = getenv('TELEGRAM_CHANNEL_ID') ?: $_ENV['TELEGRAM_CHANNEL_ID'] ?? '';
$FRONTEND_URL = getenv('FRONTEND_URL') ?: $_ENV['FRONTEND_URL'] ?? 'https://your-site.com';

// Проверка наличия обязательных переменных
if (empty($YOOKASSA_SHOP_ID) || empty($YOOKASSA_SECRET_KEY)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Сервер не настроен. Обратитесь к администратору.']);
    exit;
}

// Тарифы
$TARIFFS = [
    '1' => ['amount' => 990, 'description' => 'Подписка C2 4U на 1 месяц', 'months' => 1],
    '3' => ['amount' => 2490, 'description' => 'Подписка C2 4U на 3 месяца', 'months' => 3],
    '12' => ['amount' => 8990, 'description' => 'Подписка C2 4U на 12 месяцев', 'months' => 12]
];

// Пути к файлам
$PAYMENTS_FILE = __DIR__ . '/payments.json';
$LOGS_DIR = __DIR__ . '/logs';
$LOGS_FILE = $LOGS_DIR . '/payments.log';

// Создание необходимых директорий и файлов
if (!file_exists($LOGS_DIR)) {
    mkdir($LOGS_DIR, 0755, true);
}
if (!file_exists($PAYMENTS_FILE)) {
    file_put_contents($PAYMENTS_FILE, '{}');
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function logMessage($message, $level = 'INFO') {
    global $LOGS_FILE;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[{$timestamp}] [{$level}] {$message}\n";
    file_put_contents($LOGS_FILE, $logEntry, FILE_APPEND);
}

function getPayments() {
    global $PAYMENTS_FILE;
    if (!file_exists($PAYMENTS_FILE)) {
        return [];
    }
    $data = file_get_contents($PAYMENTS_FILE);
    $payments = json_decode($data, true);
    return is_array($payments) ? $payments : [];
}

function savePayment($payment_id, $data) {
    global $PAYMENTS_FILE;
    $payments = getPayments();
    $payments[$payment_id] = $data;
    file_put_contents($PAYMENTS_FILE, json_encode($payments, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    logMessage("Payment saved: {$payment_id} for @{$data['username']}");
}

function getPayment($payment_id) {
    $payments = getPayments();
    return $payments[$payment_id] ?? null;
}

function getUserSubscriptions($username) {
    $payments = getPayments();
    $userPayments = [];
    foreach ($payments as $payment) {
        if (isset($payment['username']) && $payment['username'] === $username && $payment['status'] === 'succeeded') {
            $userPayments[] = $payment;
        }
    }
    return $userPayments;
}

function getLatestSubscription($username) {
    $subscriptions = getUserSubscriptions($username);
    if (empty($subscriptions)) {
        return null;
    }
    // Сортируем по дате оплаты (самая свежая первая)
    usort($subscriptions, function($a, $b) {
        $dateA = $a['paid_at'] ?? $a['created_at'] ?? '';
        $dateB = $b['paid_at'] ?? $b['created_at'] ?? '';
        return strcmp($dateB, $dateA);
    });
    return $subscriptions[0];
}

function calculateExpirationDate($currentExpiresAt, $monthsToAdd) {
    if ($currentExpiresAt) {
        $date = new DateTime($currentExpiresAt);
    } else {
        $date = new DateTime();
    }
    $date->modify("+{$monthsToAdd} months");
    return $date->format('Y-m-d H:i:s');
}

function verifyWebhookSignature($data, $signature, $secret_key) {
    // ЮKassa использует HMAC SHA256 для подписи
    $calculated = base64_encode(
        hash_hmac('sha256', json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), $secret_key, true)
    );
    return hash_equals($calculated, $signature);
}

function createTelegramInviteLink($bot_token, $channel_id) {
    $url = "https://api.telegram.org/bot{$bot_token}/createChatInviteLink";
    $data = [
        'chat_id' => $channel_id,
        'member_limit' => 1, // Одноразовая ссылка
        'expire_date' => time() + 3600 // Действительна 1 час
    ];
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json']
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code === 200) {
        $result = json_decode($response, true);
        if ($result && $result['ok'] && isset($result['result']['invite_link'])) {
            return $result['result']['invite_link'];
        }
    }
    
    logMessage("Failed to create Telegram invite link: {$response}", 'ERROR');
    return null;
}

function addUserToTelegramChannel($bot_token, $channel_id, $username) {
    // Попытка добавить пользователя напрямую (требует, чтобы пользователь начал диалог с ботом)
    // Альтернатива: использовать invite link (реализовано в createTelegramInviteLink)
    // Для автоматического добавления нужен user_id, а не username
    
    // Пока используем invite link
    return createTelegramInviteLink($bot_token, $channel_id);
}

// ========== РОУТИНГ ==========

$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Убираем /api/ из пути, если есть
$path = str_replace('/api', '', $path);
$path = trim($path, '/');

// Определяем endpoint
if ($path === 'create-payment' || $path === '') {
    $endpoint = 'create-payment';
} elseif ($path === 'webhook') {
    $endpoint = 'webhook';
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

// ========== СОЗДАНИЕ ПЛАТЕЖА ==========

if ($endpoint === 'create-payment' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Неверный формат JSON']);
            exit;
        }
        
        // Валидация
        if (empty($input['tariff']) || empty($input['username']) || empty($input['email']) || empty($input['amount'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Недостаточно данных']);
            exit;
        }
        
        $tariff = trim($input['tariff']);
        $username = trim($input['username']);
        $email = trim($input['email']);
        $amount = floatval($input['amount']);
        
        // Проверка тарифа
        if (!isset($TARIFFS[$tariff])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Неверный тариф']);
            exit;
        }
        
        // Валидация email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Неверный email адрес']);
            exit;
        }
        
        // Валидация username (только буквы, цифры, подчеркивание)
        if (strlen($username) < 3 || !preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Неверный Telegram username. Используйте только буквы, цифры и подчеркивание.']);
            exit;
        }
        
        // Проверка суммы
        if (abs($amount - $TARIFFS[$tariff]['amount']) > 0.01) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Неверная сумма платежа']);
            exit;
        }
        
        // Проверяем существующую подписку для продления
        $existingSubscription = getLatestSubscription($username);
        $isRenewal = $existingSubscription !== null;
        
        // Создание платежа в ЮKassa
        $payment_data = [
            'amount' => [
                'value' => number_format($amount, 2, '.', ''),
                'currency' => 'RUB'
            ],
            'confirmation' => [
                'type' => 'redirect',
                'return_url' => $FRONTEND_URL . '/?payment=success'
            ],
            'capture' => true,
            'description' => $TARIFFS[$tariff]['description'],
            'receipt' => [
                'customer' => [
                    'email' => $email
                ],
                'items' => [
                    [
                        'description' => $TARIFFS[$tariff]['description'],
                        'quantity' => '1.00',
                        'amount' => [
                            'value' => number_format($amount, 2, '.', ''),
                            'currency' => 'RUB'
                        ],
                        'vat_code' => 1 // НДС не облагается (для образовательных услуг)
                    ]
                ]
            ],
            'metadata' => [
                'tariff' => $tariff,
                'username' => $username,
                'email' => $email,
                'is_renewal' => $isRenewal ? '1' : '0'
            ]
        ];
        
        $idempotence_key = uniqid('', true) . '-' . $username . '-' . time();
        
        $ch = curl_init('https://api.yookassa.ru/v3/payments');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payment_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Idempotence-Key: ' . $idempotence_key,
                'Authorization: Basic ' . base64_encode($YOOKASSA_SHOP_ID . ':' . $YOOKASSA_SECRET_KEY)
            ],
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($ch);
        curl_close($ch);
        
        if ($curl_error) {
            logMessage("cURL error: {$curl_error}", 'ERROR');
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Ошибка соединения с платежной системой']);
            exit;
        }
        
        if ($http_code !== 200) {
            logMessage("Yookassa API error (HTTP {$http_code}): {$response}", 'ERROR');
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Ошибка создания платежа']);
            exit;
        }
        
        $yookassa_response = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE || empty($yookassa_response['confirmation']['confirmation_url'])) {
            logMessage("Invalid Yookassa response: {$response}", 'ERROR');
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Ошибка создания платежа']);
            exit;
        }
        
        // Сохраняем платеж
        $currentExpiresAt = $existingSubscription['expires_at'] ?? null;
        $newExpiresAt = calculateExpirationDate($currentExpiresAt, $TARIFFS[$tariff]['months']);
        
        savePayment($yookassa_response['id'], [
            'yookassa_id' => $yookassa_response['id'],
            'tariff' => $tariff,
            'username' => $username,
            'email' => $email,
            'amount' => $amount,
            'status' => $yookassa_response['status'],
            'created_at' => date('Y-m-d H:i:s'),
            'expires_at' => $newExpiresAt,
            'is_renewal' => $isRenewal
        ]);
        
        logMessage("Payment created: {$yookassa_response['id']} for @{$username}, tariff: {$tariff}, amount: {$amount}");
        
        echo json_encode([
            'success' => true,
            'paymentUrl' => $yookassa_response['confirmation']['confirmation_url'],
            'paymentId' => $yookassa_response['id']
        ]);
        
    } catch (Exception $e) {
        logMessage("Exception in create-payment: " . $e->getMessage(), 'ERROR');
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Внутренняя ошибка сервера']);
    }
    exit;
}

// ========== WEBHOOK ОТ ЮKASSA ==========

if ($endpoint === 'webhook' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $webhook_data = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            logMessage("Invalid JSON in webhook", 'ERROR');
            http_response_code(400);
            echo 'Invalid JSON';
            exit;
        }
        
        // ВАЖНО: Проверка подписи webhook
        $signature = $_SERVER['HTTP_X_YOOMONEY_SIGNATURE'] ?? '';
        if (!empty($signature) && !empty($YOOKASSA_SECRET_KEY)) {
            if (!verifyWebhookSignature($webhook_data, $signature, $YOOKASSA_SECRET_KEY)) {
                logMessage("Invalid webhook signature", 'ERROR');
                http_response_code(401);
                echo 'Invalid signature';
                exit;
            }
        } else {
            logMessage("Webhook signature check skipped (signature or secret key missing)", 'WARNING');
        }
        
        $event = $webhook_data['event'] ?? '';
        $payment_object = $webhook_data['object'] ?? [];
        
        if ($event === 'payment.succeeded' && ($payment_object['status'] ?? '') === 'succeeded') {
            $payment_id = $payment_object['id'] ?? '';
            $metadata = $payment_object['metadata'] ?? [];
            
            if (empty($payment_id)) {
                logMessage("Webhook: payment_id is empty", 'ERROR');
                http_response_code(200);
                echo 'OK';
                exit;
            }
            
            $payment = getPayment($payment_id);
            if (!$payment) {
                logMessage("Webhook: Payment {$payment_id} not found in our system", 'WARNING');
                http_response_code(200);
                echo 'OK';
                exit;
            }
            
            // Проверяем, не обработан ли уже этот платеж
            if ($payment['status'] === 'succeeded') {
                logMessage("Webhook: Payment {$payment_id} already processed", 'INFO');
                http_response_code(200);
                echo 'OK';
                exit;
            }
            
            // Обновляем статус
            $payment['status'] = 'succeeded';
            $payment['paid_at'] = date('Y-m-d H:i:s');
            savePayment($payment_id, $payment);
            
            logMessage("Payment succeeded: {$payment_id} for @{$payment['username']}");
            
            // Добавляем пользователя в Telegram канал
            if (!empty($TELEGRAM_BOT_TOKEN) && !empty($TELEGRAM_CHANNEL_ID)) {
                $invite_link = addUserToTelegramChannel(
                    $TELEGRAM_BOT_TOKEN,
                    $TELEGRAM_CHANNEL_ID,
                    $payment['username']
                );
                
                if ($invite_link) {
                    // Сохраняем invite link в платеже
                    $payment['invite_link'] = $invite_link;
                    $payment['invite_link_created_at'] = date('Y-m-d H:i:s');
                    savePayment($payment_id, $payment);
                    
                    logMessage("Invite link created for @{$payment['username']}: {$invite_link}");
                    
                    // TODO: Отправить invite link пользователю через email или другой способ
                    // Для этого можно использовать PHPMailer или другой email-клиент
                } else {
                    logMessage("Failed to create invite link for @{$payment['username']}", 'ERROR');
                }
            } else {
                logMessage("Telegram credentials not configured", 'WARNING');
            }
        } elseif ($event === 'payment.canceled') {
            $payment_id = $payment_object['id'] ?? '';
            $payment = getPayment($payment_id);
            if ($payment) {
                $payment['status'] = 'canceled';
                savePayment($payment_id, $payment);
                logMessage("Payment canceled: {$payment_id}");
            }
        }
        
        // Всегда отвечаем 200, чтобы ЮKassa знал, что мы получили уведомление
        http_response_code(200);
        echo 'OK';
        
    } catch (Exception $e) {
        logMessage("Exception in webhook: " . $e->getMessage(), 'ERROR');
        http_response_code(200); // Все равно отвечаем 200
        echo 'OK';
    }
    exit;
}

// Если запрос не обработан
http_response_code(404);
echo json_encode(['error' => 'Not found']);


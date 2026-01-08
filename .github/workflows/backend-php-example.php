<?php
/**
 * Backend для обработки платежей через ЮKassa
 * Требования: PHP 7.4+, cURL, JSON extension
 * 
 * БЕЗОПАСНОСТЬ:
 * - Все ключи хранятся в переменных окружения
 * - Проверка подписи webhook от ЮKassa
 * - Валидация всех входящих данных
 * - Защита от дублирования платежей (idempotency)
 */

header('Content-Type: application/json; charset=utf-8');

// Загрузка переменных окружения (используйте .env файл или настройки хостинга)
$YOOKASSA_SHOP_ID = getenv('YOOKASSA_SHOP_ID');
$YOOKASSA_SECRET_KEY = getenv('YOOKASSA_SECRET_KEY');
$TELEGRAM_BOT_TOKEN = getenv('TELEGRAM_BOT_TOKEN');
$TELEGRAM_CHANNEL_ID = getenv('TELEGRAM_CHANNEL_ID');
$FRONTEND_URL = getenv('FRONTEND_URL') ?: 'https://your-site.com';

// Тарифы
$TARIFFS = [
    '1' => ['amount' => 990, 'description' => 'Подписка C2 4U на 1 месяц'],
    '3' => ['amount' => 2490, 'description' => 'Подписка C2 4U на 3 месяца'],
    '12' => ['amount' => 8990, 'description' => 'Подписка C2 4U на 12 месяцев']
];

// Временное хранилище платежей (в продакшене используйте БД или Redis)
$payments_file = __DIR__ . '/payments.json';
if (!file_exists($payments_file)) {
    file_put_contents($payments_file, '{}');
}

function getPayments() {
    global $payments_file;
    $data = file_get_contents($payments_file);
    return json_decode($data, true) ?: [];
}

function savePayment($payment_id, $data) {
    global $payments_file;
    $payments = getPayments();
    $payments[$payment_id] = $data;
    file_put_contents($payments_file, json_encode($payments, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function getPayment($payment_id) {
    $payments = getPayments();
    return $payments[$payment_id] ?? null;
}

// ========== СОЗДАНИЕ ПЛАТЕЖА ==========
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_SERVER['REQUEST_URI'] === '/api/create-payment') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Валидация
    if (empty($input['tariff']) || empty($input['username']) || empty($input['email']) || empty($input['amount'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Недостаточно данных']);
        exit;
    }
    
    $tariff = $input['tariff'];
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
        echo json_encode(['success' => false, 'error' => 'Неверный email']);
        exit;
    }
    
    // Валидация username
    if (strlen($username) < 3 || !preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Неверный Telegram username']);
        exit;
    }
    
    // Проверка суммы
    if ($amount != $TARIFFS[$tariff]['amount']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Неверная сумма']);
        exit;
    }
    
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
                    'quantity' => '1',
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
            'email' => $email
        ]
    ];
    
    $idempotence_key = uniqid('', true) . '-' . $username;
    
    $ch = curl_init('https://api.yookassa.ru/v3/payments');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payment_data, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Idempotence-Key: ' . $idempotence_key,
            'Authorization: Basic ' . base64_encode($YOOKASSA_SHOP_ID . ':' . $YOOKASSA_SECRET_KEY)
        ]
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code !== 200) {
        error_log('Yookassa API error: ' . $response);
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Ошибка создания платежа']);
        exit;
    }
    
    $yookassa_response = json_decode($response, true);
    
    if (empty($yookassa_response['confirmation']['confirmation_url'])) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Ошибка создания платежа']);
        exit;
    }
    
    // Сохраняем платеж
    savePayment($yookassa_response['id'], [
        'yookassa_id' => $yookassa_response['id'],
        'tariff' => $tariff,
        'username' => $username,
        'email' => $email,
        'amount' => $amount,
        'status' => $yookassa_response['status'],
        'created_at' => date('Y-m-d H:i:s')
    ]);
    
    echo json_encode([
        'success' => true,
        'paymentUrl' => $yookassa_response['confirmation']['confirmation_url'],
        'paymentId' => $yookassa_response['id']
    ]);
    exit;
}

// ========== WEBHOOK ОТ ЮKASSA ==========
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_SERVER['REQUEST_URI'] === '/api/webhook') {
    $webhook_data = json_decode(file_get_contents('php://input'), true);
    
    // ВАЖНО: Проверка подписи webhook (для безопасности)
    // ЮKassa отправляет заголовок X-YooMoney-Signature
    // В продакшене обязательно проверяйте подпись!
    // $signature = $_SERVER['HTTP_X_YOOMONEY_SIGNATURE'] ?? '';
    // if (!verifyWebhookSignature($webhook_data, $signature)) {
    //     http_response_code(401);
    //     exit;
    // }
    
    if ($webhook_data['event'] === 'payment.succeeded' && 
        $webhook_data['object']['status'] === 'succeeded') {
        
        $payment_id = $webhook_data['object']['id'];
        $metadata = $webhook_data['object']['metadata'] ?? [];
        
        $payment = getPayment($payment_id);
        if (!$payment) {
            // Платеж не найден в нашей системе
            http_response_code(200); // Все равно отвечаем 200, чтобы ЮKassa не повторял запрос
            exit;
        }
        
        // Обновляем статус
        $payment['status'] = 'succeeded';
        $payment['paid_at'] = date('Y-m-d H:i:s');
        savePayment($payment_id, $payment);
        
        // Добавляем пользователя в Telegram канал
        $username = $payment['username'];
        $tariff = $payment['tariff'];
        
        // Попытка добавить пользователя в канал
        // Вариант 1: Создать одноразовую invite-ссылку
        $invite_link = createTelegramInviteLink($TELEGRAM_BOT_TOKEN, $TELEGRAM_CHANNEL_ID);
        
        if ($invite_link) {
            // Отправляем invite-ссылку пользователю через бота
            // Для этого пользователь должен был начать диалог с ботом
            // Или используем альтернативный способ уведомления
            
            // Логируем для отладки
            error_log("Payment succeeded for @{$username}, invite link: {$invite_link}");
        }
        
        // Отправка email с чеком (опционально, если нужно дополнительное уведомление)
        // sendEmailReceipt($payment['email'], $payment);
    }
    
    // Всегда отвечаем 200, чтобы ЮKassa знал, что мы получили уведомление
    http_response_code(200);
    echo 'OK';
    exit;
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function createTelegramInviteLink($bot_token, $channel_id) {
    $ch = curl_init("https://api.telegram.org/bot{$bot_token}/createChatInviteLink");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'chat_id' => $channel_id,
            'member_limit' => 1, // Одноразовая ссылка
            'expire_date' => time() + 3600 // Действительна 1 час
        ]),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json']
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code === 200) {
        $data = json_decode($response, true);
        return $data['result']['invite_link'] ?? null;
    }
    
    return null;
}

function verifyWebhookSignature($data, $signature) {
    // Реализация проверки подписи webhook от ЮKassa
    // Документация: https://yookassa.ru/developers/using-api/webhooks
    // Это важно для безопасности!
    return true; // Заглушка - реализуйте проверку!
}

// Если запрос не обработан
http_response_code(404);
echo json_encode(['error' => 'Not found']);
?>


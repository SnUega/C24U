# Инструкция по настройке платежной системы

## Шаг 1: Создание Telegram Bot

1. Откройте Telegram и найдите **@BotFather**
2. Отправьте команду `/newbot`
3. Следуйте инструкциям и создайте бота
4. Сохраните **токен бота** (например: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Шаг 2: Настройка Telegram канала

1. Создайте приватный канал в Telegram
2. Добавьте вашего бота в канал как **администратора**
3. Дайте боту права:
   - ✅ **Invite Users** (приглашать пользователей)
   - ✅ **Add New Admins** (опционально)
4. Получите **ID канала**:
   - Добавьте в канал бота @userinfobot
   - Он покажет ID канала (например: `-1001234567890`)

## Шаг 3: Регистрация в ЮKassa

1. Зарегистрируйтесь на [kassa.yandex.ru](https://kassa.yandex.ru)
2. Пройдите верификацию (нужен ИП или ООО)
3. Получите:
   - **Shop ID** (ID магазина)
   - **Secret Key** (секретный ключ)

## Шаг 4: Настройка Backend

### Установка зависимостей

```bash
npm install express axios node-telegram-bot-api dotenv
```

### Создание .env файла

Создайте файл `.env` в папке с backend:

```env
# ЮKassa
YOOKASSA_SHOP_ID=ваш_shop_id
YOOKASSA_SECRET_KEY=ваш_secret_key

# Telegram
TELEGRAM_BOT_TOKEN=ваш_токен_бота
TELEGRAM_CHANNEL_ID=-1001234567890

# URLs
BACKEND_URL=https://ваш-домен.com
FRONTEND_URL=https://c24u.club
PORT=3000
```

### Настройка Webhook в ЮKassa

1. В личном кабинете ЮKassa перейдите в **Настройки → HTTP-уведомления**
2. Укажите URL: `https://ваш-домен.com/api/payment-webhook`
3. Включите события: `payment.succeeded`

## Шаг 5: Обновление Frontend

В файле `js/main.js` обновите URL backend:

```javascript
const response = await fetch('https://ваш-домен.com/api/create-payment', {
  // ...
});
```

## Шаг 6: Деплой Backend

### Вариант 1: VPS (рекомендуется)

1. Арендуйте VPS (например, на Timeweb, Selectel)
2. Установите Node.js
3. Загрузите код
4. Настройте PM2 для автозапуска:
   ```bash
   npm install -g pm2
   pm2 start backend-example.js
   pm2 save
   ```

### Вариант 2: Serverless (Vercel/Netlify)

Используйте serverless функции для обработки webhook.

### Вариант 3: Локальный сервер с ngrok (для тестирования)

```bash
# Установите ngrok
ngrok http 3000

# Используйте полученный URL для webhook
```

## Шаг 7: Тестирование

1. Запустите backend: `node backend-example.js`
2. Откройте сайт и попробуйте создать платеж
3. Используйте тестовые карты ЮKassa:
   - Успешная оплата: `5555 5555 5555 5555`
   - Недостаточно средств: `5555 5555 5555 4477`

## Альтернатива: CloudPayments

Если хотите использовать CloudPayments вместо ЮKassa:

1. Зарегистрируйтесь на [cloudpayments.ru](https://cloudpayments.ru)
2. Получите Public ID и API Secret
3. Обновите код в `backend-example.js` для работы с CloudPayments API

## Безопасность

⚠️ **Важно:**
- Никогда не коммитьте `.env` файл в Git
- Используйте HTTPS для webhook
- Проверяйте подпись webhook от ЮKassa
- Храните токены в безопасном месте

## Поддержка

При возникновении проблем проверьте:
- Логи backend сервера
- Настройки webhook в ЮKassa
- Права бота в Telegram канале
- Корректность токенов и ID


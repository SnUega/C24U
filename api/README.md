# API для обработки платежей C2 4U

## Структура файлов

```
api/
├── index.php          # Главный файл API
├── .htaccess         # Роутинг и настройки Apache
├── .gitignore        # Игнорируемые файлы
├── payments.json     # Временное хранилище платежей (создается автоматически)
└── logs/             # Папка для логов (создается автоматически)
    └── payments.log
```

## Установка

### 1. Загрузите файлы на хостинг

Загрузите папку `api/` на ваш хостинг в корневую директорию сайта или в подпапку.

### 2. Настройте права доступа

```bash
chmod 755 api/
chmod 644 api/index.php
chmod 666 api/payments.json  # После создания файла
chmod 755 api/logs/
chmod 666 api/logs/payments.log  # После создания файла
```

Или через FTP-клиент:
- Папки: права 755
- Файлы: права 644
- payments.json и logs/: права 666 (для записи)

### 3. Настройте переменные окружения

#### Вариант A: Через .htaccess (рекомендуется для shared hosting)

Откройте `api/.htaccess` и раскомментируйте строки:

```apache
SetEnv YOOKASSA_SHOP_ID "ваш_shop_id"
SetEnv YOOKASSA_SECRET_KEY "ваш_секретный_ключ"
SetEnv TELEGRAM_BOT_TOKEN "ваш_токен_бота"
SetEnv TELEGRAM_CHANNEL_ID "ваш_id_канала"
SetEnv FRONTEND_URL "https://your-site.com"
```

#### Вариант B: Через cPanel (если доступен)

1. Зайдите в cPanel
2. Найдите "Environment Variables" или "Переменные окружения"
3. Добавьте все необходимые переменные

#### Вариант C: Через php.ini или .user.ini

Создайте файл `.user.ini` в папке `api/`:

```ini
auto_prepend_file = /path/to/config.php
```

И создайте `config.php`:

```php
<?php
putenv('YOOKASSA_SHOP_ID=ваш_shop_id');
putenv('YOOKASSA_SECRET_KEY=ваш_секретный_ключ');
putenv('TELEGRAM_BOT_TOKEN=ваш_токен_бота');
putenv('TELEGRAM_CHANNEL_ID=ваш_id_канала');
putenv('FRONTEND_URL=https://your-site.com');
```

### 4. Проверьте работу API

Откройте в браузере:
```
https://your-site.com/api/
```

Должна вернуться ошибка 404 с JSON `{"error":"Not found"}` - это нормально, значит API работает.

Для теста создания платежа используйте Postman или curl:

```bash
curl -X POST https://your-site.com/api/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "tariff": "3",
    "username": "testuser",
    "email": "test@example.com",
    "amount": 2490
  }'
```

## Настройка webhook в ЮKassa

1. Зайдите в личный кабинет ЮKassa
2. Настройки → Уведомления
3. URL для уведомлений: `https://your-site.com/api/webhook`
4. Выберите события:
   - ✅ `payment.succeeded` (обязательно)
   - ✅ `payment.canceled` (опционально)

## Обновление frontend

В файле `js/main.js` обновите URL:

```javascript
const response = await fetch('https://your-site.com/api/create-payment', {
  // ...
});
```

## Проверка логов

Логи сохраняются в `api/logs/payments.log`. Проверяйте их при отладке:

```bash
tail -f api/logs/payments.log
```

## Безопасность

✅ Проверка подписи webhook реализована  
✅ Валидация всех входящих данных  
✅ Защита от дублирования платежей (idempotency)  
✅ Все ключи в переменных окружения  

⚠️ **Важно:** Убедитесь, что файл `payments.json` недоступен через веб (настроено в .htaccess)

## Поддержка

При возникновении проблем проверьте:
1. Права доступа к файлам
2. Логи в `api/logs/payments.log`
3. Переменные окружения
4. Настройки webhook в ЮKassa


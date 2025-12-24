/**
 * Backend пример для интеграции платежей с Telegram
 * 
 * Установка зависимостей:
 * npm install express axios node-telegram-bot-api dotenv
 * 
 * Настройка:
 * 1. Создайте .env файл с переменными (см. ниже)
 * 2. Запустите: node backend-example.js
 * 3. Используйте ngrok или аналогичный сервис для публичного URL
 */

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

// Конфигурация
const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID; // ID канала (например: -1001234567890)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5501';

// Инициализация Telegram бота
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// Хранилище платежей (в продакшене используйте БД)
const payments = new Map();

// ========== СОЗДАНИЕ ПЛАТЕЖА ==========
app.post('/api/create-payment', async (req, res) => {
  try {
    const { tariff, username, amount } = req.body;
    
    if (!tariff || !username || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Недостаточно данных' 
      });
    }
    
    // Создаем платеж в ЮKassa
    const paymentData = {
      amount: {
        value: amount.toString(),
        currency: 'RUB'
      },
      confirmation: {
        type: 'redirect',
        return_url: `${FRONTEND_URL}/?payment=success`
      },
      capture: true,
      description: `Подписка C2 4U на ${tariff} ${tariff === '1' ? 'месяц' : tariff === '3' ? 'месяца' : 'месяцев'}`,
      metadata: {
        tariff: tariff,
        username: username
      }
    };
    
    const response = await axios.post(
      'https://api.yookassa.ru/v3/payments',
      paymentData,
      {
        auth: {
          username: YOOKASSA_SHOP_ID,
          password: YOOKASSA_SECRET_KEY
        },
        headers: {
          'Idempotence-Key': `${Date.now()}-${username}`
        }
      }
    );
    
    // Сохраняем информацию о платеже
    payments.set(response.data.id, {
      username: username,
      tariff: tariff,
      amount: amount,
      status: 'pending'
    });
    
    res.json({
      success: true,
      paymentUrl: response.data.confirmation.confirmation_url,
      paymentId: response.data.id
    });
    
  } catch (error) {
    console.error('Payment creation error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка создания платежа' 
    });
  }
});

// ========== WEBHOOK ОТ ЮKASSA ==========
app.post('/api/payment-webhook', async (req, res) => {
  try {
    const event = req.body;
    
    // Проверяем тип события
    if (event.event === 'payment.succeeded') {
      const payment = event.object;
      const paymentInfo = payments.get(payment.id);
      
      if (!paymentInfo) {
        console.error('Payment not found:', payment.id);
        return res.status(404).send('Payment not found');
      }
      
      // Проверяем, что платеж успешен
      if (payment.status === 'succeeded' && payment.paid) {
        // Добавляем пользователя в Telegram канал
        try {
          await bot.exportChatInviteLink(TELEGRAM_CHANNEL_ID);
          
          // Отправляем приглашение пользователю
          await bot.sendMessage(
            paymentInfo.username.startsWith('@') 
              ? paymentInfo.username 
              : `@${paymentInfo.username}`,
            `🎉 Добро пожаловать в C2 4U!\n\n` +
            `Ваша подписка активирована на ${paymentInfo.tariff} ${paymentInfo.tariff === '1' ? 'месяц' : paymentInfo.tariff === '3' ? 'месяца' : 'месяцев'}.\n\n` +
            `Перейдите по ссылке, чтобы присоединиться к закрытому каналу:\n` +
            `https://t.me/joinchat/YOUR_INVITE_LINK`
          );
          
          // Обновляем статус платежа
          paymentInfo.status = 'completed';
          payments.set(payment.id, paymentInfo);
          
          console.log(`User ${paymentInfo.username} added to channel`);
          
        } catch (telegramError) {
          console.error('Telegram error:', telegramError);
          // В случае ошибки можно отправить уведомление администратору
        }
      }
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

// ========== ПРОВЕРКА СТАТУСА ПЛАТЕЖА ==========
app.get('/api/payment-status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const paymentInfo = payments.get(paymentId);
    
    if (!paymentInfo) {
      return res.status(404).json({ 
        success: false, 
        error: 'Платеж не найден' 
      });
    }
    
    res.json({
      success: true,
      status: paymentInfo.status
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка проверки статуса' 
    });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook URL: ${BACKEND_URL}/api/payment-webhook`);
});


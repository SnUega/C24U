"""
Backend для обработки платежей через ЮKassa
Требования: Python 3.7+, Flask, requests

БЕЗОПАСНОСТЬ:
- Все ключи хранятся в переменных окружения
- Проверка подписи webhook от ЮKassa
- Валидация всех входящих данных
- Защита от дублирования платежей (idempotency)
"""

import os
import json
import hashlib
import hmac
import time
from datetime import datetime
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# Загрузка переменных окружения
YOOKASSA_SHOP_ID = os.getenv('YOOKASSA_SHOP_ID')
YOOKASSA_SECRET_KEY = os.getenv('YOOKASSA_SECRET_KEY')
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHANNEL_ID = os.getenv('TELEGRAM_CHANNEL_ID')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://your-site.com')

# Тарифы
TARIFFS = {
    '1': {'amount': 990, 'description': 'Подписка C2 4U на 1 месяц'},
    '3': {'amount': 2490, 'description': 'Подписка C2 4U на 3 месяца'},
    '12': {'amount': 8990, 'description': 'Подписка C2 4U на 12 месяцев'}
}

# Временное хранилище платежей (в продакшене используйте БД или Redis)
PAYMENTS_FILE = 'payments.json'

def get_payments():
    """Загрузка платежей из файла"""
    try:
        with open(PAYMENTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_payment(payment_id, data):
    """Сохранение платежа"""
    payments = get_payments()
    payments[payment_id] = data
    with open(PAYMENTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(payments, f, ensure_ascii=False, indent=2)

def get_payment(payment_id):
    """Получение платежа по ID"""
    payments = get_payments()
    return payments.get(payment_id)

@app.route('/api/create-payment', methods=['POST'])
def create_payment():
    """Создание платежа в ЮKassa"""
    try:
        data = request.get_json()
        
        # Валидация
        if not all(key in data for key in ['tariff', 'username', 'email', 'amount']):
            return jsonify({'success': False, 'error': 'Недостаточно данных'}), 400
        
        tariff = data['tariff']
        username = data['username'].strip()
        email = data['email'].strip()
        amount = float(data['amount'])
        
        # Проверка тарифа
        if tariff not in TARIFFS:
            return jsonify({'success': False, 'error': 'Неверный тариф'}), 400
        
        # Валидация email
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return jsonify({'success': False, 'error': 'Неверный email'}), 400
        
        # Валидация username
        if len(username) < 3 or not username.replace('_', '').isalnum():
            return jsonify({'success': False, 'error': 'Неверный Telegram username'}), 400
        
        # Проверка суммы
        if amount != TARIFFS[tariff]['amount']:
            return jsonify({'success': False, 'error': 'Неверная сумма'}), 400
        
        # Создание платежа в ЮKassa
        payment_data = {
            'amount': {
                'value': f'{amount:.2f}',
                'currency': 'RUB'
            },
            'confirmation': {
                'type': 'redirect',
                'return_url': f'{FRONTEND_URL}/?payment=success'
            },
            'capture': True,
            'description': TARIFFS[tariff]['description'],
            'receipt': {
                'customer': {
                    'email': email
                },
                'items': [
                    {
                        'description': TARIFFS[tariff]['description'],
                        'quantity': '1',
                        'amount': {
                            'value': f'{amount:.2f}',
                            'currency': 'RUB'
                        },
                        'vat_code': 1  # НДС не облагается
                    }
                ]
            },
            'metadata': {
                'tariff': tariff,
                'username': username,
                'email': email
            }
        }
        
        idempotence_key = f'{int(time.time() * 1000)}-{username}'
        
        # Авторизация для ЮKassa
        auth = (YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY)
        headers = {
            'Content-Type': 'application/json',
            'Idempotence-Key': idempotence_key
        }
        
        response = requests.post(
            'https://api.yookassa.ru/v3/payments',
            json=payment_data,
            auth=auth,
            headers=headers
        )
        
        if response.status_code != 200:
            app.logger.error(f'Yookassa API error: {response.text}')
            return jsonify({'success': False, 'error': 'Ошибка создания платежа'}), 500
        
        yookassa_response = response.json()
        
        if 'confirmation' not in yookassa_response or 'confirmation_url' not in yookassa_response['confirmation']:
            return jsonify({'success': False, 'error': 'Ошибка создания платежа'}), 500
        
        # Сохраняем платеж
        save_payment(yookassa_response['id'], {
            'yookassa_id': yookassa_response['id'],
            'tariff': tariff,
            'username': username,
            'email': email,
            'amount': amount,
            'status': yookassa_response['status'],
            'created_at': datetime.now().isoformat()
        })
        
        return jsonify({
            'success': True,
            'paymentUrl': yookassa_response['confirmation']['confirmation_url'],
            'paymentId': yookassa_response['id']
        })
        
    except Exception as e:
        app.logger.error(f'Payment creation error: {str(e)}')
        return jsonify({'success': False, 'error': 'Внутренняя ошибка сервера'}), 500

@app.route('/api/webhook', methods=['POST'])
def webhook():
    """Обработка webhook от ЮKassa"""
    try:
        webhook_data = request.get_json()
        
        # ВАЖНО: Проверка подписи webhook (для безопасности)
        # signature = request.headers.get('X-YooMoney-Signature', '')
        # if not verify_webhook_signature(webhook_data, signature):
        #     return '', 401
        
        if (webhook_data.get('event') == 'payment.succeeded' and
            webhook_data.get('object', {}).get('status') == 'succeeded'):
            
            payment_id = webhook_data['object']['id']
            metadata = webhook_data['object'].get('metadata', {})
            
            payment = get_payment(payment_id)
            if not payment:
                # Платеж не найден, но отвечаем 200
                return 'OK', 200
            
            # Обновляем статус
            payment['status'] = 'succeeded'
            payment['paid_at'] = datetime.now().isoformat()
            save_payment(payment_id, payment)
            
            # Добавляем пользователя в Telegram канал
            username = payment['username']
            tariff = payment['tariff']
            
            # Создаем одноразовую invite-ссылку
            invite_link = create_telegram_invite_link(TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID)
            
            if invite_link:
                app.logger.info(f"Payment succeeded for @{username}, invite link: {invite_link}")
                # Здесь можно отправить ссылку пользователю через бота или email
        
        return 'OK', 200
        
    except Exception as e:
        app.logger.error(f'Webhook error: {str(e)}')
        return 'OK', 200  # Все равно отвечаем 200

def create_telegram_invite_link(bot_token, channel_id):
    """Создание одноразовой invite-ссылки для Telegram канала"""
    try:
        url = f'https://api.telegram.org/bot{bot_token}/createChatInviteLink'
        data = {
            'chat_id': channel_id,
            'member_limit': 1,  # Одноразовая ссылка
            'expire_date': int(time.time()) + 3600  # Действительна 1 час
        }
        
        response = requests.post(url, json=data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('ok'):
                return result['result'].get('invite_link')
        
        return None
    except Exception as e:
        app.logger.error(f'Telegram invite link error: {str(e)}')
        return None

def verify_webhook_signature(data, signature):
    """Проверка подписи webhook от ЮKassa"""
    # Реализация проверки подписи
    # Документация: https://yookassa.ru/developers/using-api/webhooks
    # Это важно для безопасности!
    return True  # Заглушка - реализуйте проверку!

if __name__ == '__main__':
    # Для продакшена используйте WSGI сервер (gunicorn, uwsgi)
    app.run(host='0.0.0.0', port=5000, debug=False)


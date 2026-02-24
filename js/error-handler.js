/**
 * Централизованная обработка ошибок
 */

// Пользовательские сообщения об ошибках
const ERROR_MESSAGES = {
  'network': 'Проблема с интернет-соединением. Проверьте подключение и попробуйте снова.',
  'timeout': 'Превышено время ожидания. Пожалуйста, попробуйте позже.',
  '400': 'Неверные данные. Проверьте введённую информацию.',
  '401': 'Ошибка авторизации. Обновите страницу.',
  '403': 'Доступ запрещён.',
  '404': 'Страница не найдена.',
  '429': 'Слишком много запросов. Подождите минуту и попробуйте снова.',
  '500': 'Ошибка сервера. Мы уже работаем над исправлением.',
  '503': 'Сервис временно недоступен. Попробуйте позже.',
  'default': 'Произошла ошибка. Пожалуйста, попробуйте позже или свяжитесь с поддержкой.'
};

/**
 * Преобразует техническую ошибку в понятное сообщение для пользователя
 */
function getUserFriendlyError(error) {
  // Если это уже пользовательское сообщение
  if (typeof error === 'string' && !error.includes('Error:') && !error.includes('at ')) {
    return error;
  }
  
  // Если это объект с сообщением
  if (error && error.message) {
    const msg = error.message.toLowerCase();
    
    // Сетевые ошибки
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
      return ERROR_MESSAGES.network;
    }
    
    if (msg.includes('timeout')) {
      return ERROR_MESSAGES.timeout;
    }
    
    // HTTP ошибки
    const httpMatch = msg.match(/http\s*(\d{3})/i) || error.status;
    if (httpMatch) {
      const status = typeof httpMatch === 'number' ? httpMatch : parseInt(httpMatch[1]);
      if (ERROR_MESSAGES[status]) {
        return ERROR_MESSAGES[status];
      }
    }
    
    // Если сообщение уже понятное, возвращаем его
    if (msg.length < 100 && !msg.includes('unexpected token')) {
      return error.message;
    }
  }
  
  // Логируем техническую ошибку для разработчиков
  if (typeof console !== 'undefined' && console.error) {
    console.error('Technical error:', error);
  }
  
  return ERROR_MESSAGES.default;
}

/**
 * Показывает уведомление об ошибке
 */
function showErrorNotification(message, duration = 5000) {
  const errorMsg = getUserFriendlyError(message);
  
  // Используем существующую функцию showNotification если есть
  if (typeof showNotification === 'function') {
    showNotification(errorMsg, 'error');
    return;
  }
  
  // Fallback: создаём простое уведомление
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.textContent = errorMsg;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f44336;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 400px;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

/**
 * Безопасный fetch с обработкой ошибок
 */
async function safeFetch(url, options = {}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(ERROR_MESSAGES.timeout);
    }
    throw error;
  }
}

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getUserFriendlyError, showErrorNotification, safeFetch };
}

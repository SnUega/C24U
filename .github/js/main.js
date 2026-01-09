document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  /* ========== LENIS + GSAP SCROLLTRIGGER INTEGRATION ========== */
  
  // Initialize GSAP first
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('GSAP or ScrollTrigger not loaded');
    return;
  }
  
  gsap.registerPlugin(ScrollTrigger);
  
  // Определяем, мобильное ли устройство (доступно глобально в блоке)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  
  // Initialize Lenis
  let lenis = null;
  
  if (typeof Lenis !== 'undefined') {
    
    lenis = new Lenis({
      duration: isMobile ? 1.0 : 1.4, // Быстрее на мобильных для более отзывчивого скролла
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: isMobile ? 1.2 : 1.5, // Меньше чувствительность на мобильных
      infinite: false,
      syncTouch: isMobile ? false : true, // Отключаем syncTouch на мобильных для более плавного скролла
      syncTouchLerp: isMobile ? 0.25 : 0.075, // Более быстрое сглаживание на мобильных
    });
    
    // CRITICAL: Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    
    // CRITICAL: Use GSAP ticker for Lenis RAF loop (prevents conflicts)
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    
    // Disable GSAP's lag smoothing for better sync
    gsap.ticker.lagSmoothing(0);
    
    // Оптимизация для мобильных устройств
    if (isMobile) {
      // Уменьшаем частоту обновления ScrollTrigger на мобильных
      ScrollTrigger.config({ 
        autoRefreshEvents: "visibilitychange,DOMContentLoaded,load"
      });
    }
    
    // Store globally
    window.lenis = lenis;
    
  } else {
    console.warn('Lenis not available, using native scroll');
  }

  /* ========== GSAP ANIMATIONS ========== */
  {

    // ===== CASCADING REVEAL ANIMATIONS =====
    
    // Hero section - cascade from right to left, smooth fade from below
    const heroElements = document.querySelectorAll('.hero .hero-description, .hero .hero-cta, .hero .hero-features');
    heroElements.forEach((el, i) => {
      gsap.to(el, { 
          opacity: 1, 
          x: 0,
          y: 0, 
        duration: 0.9, 
        ease: 'expo.out',
        delay: 0.2 + i * 0.1
      });
    });
    
    // Hero h1 with letter-spacing animation - fade from below
    const heroH1 = document.querySelector('.hero h1');
    if (heroH1) {
      gsap.to(heroH1, { 
        opacity: 1, 
        x: 0,
        y: 0,
        letterSpacing: '0em',
        duration: 1.0, 
        ease: 'expo.out',
        delay: 0.3
      });
    }
    
    // Hero decoration parallax on scroll
    gsap.to('.hero-decoration', {
      y: 150,
      rotation: 15,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5
      }
    });

    // Section headers - smooth fade from below with letter-spacing
    gsap.utils.toArray('.section-header').forEach(header => {
      const h2 = header.querySelector('h2');
      const p = header.querySelector('p');
      
      if (h2) {
        gsap.to(h2, { 
          opacity: 1, y: 0, letterSpacing: '0em',
          duration: 0.9, ease: 'expo.out',
          scrollTrigger: { trigger: header, start: 'top 95%', once: true }
        });
      }
      if (p) {
        gsap.to(p, { 
          opacity: 1, y: 0,
          duration: 0.8, ease: 'expo.out', delay: 0.08,
          scrollTrigger: { trigger: header, start: 'top 95%', once: true }
        });
      }
    });

    // About section - smooth fade from below
    const aboutPhoto = document.querySelector('.about .photo-placeholder');
    const aboutContent = document.querySelector('.about-content');
    
    if (aboutPhoto) {
      gsap.to(aboutPhoto.parentElement, { 
        opacity: 1, y: 0,
        duration: 0.9, ease: 'expo.out',
        scrollTrigger: { trigger: '.about', start: 'top 95%', once: true }
      });
    }
    
    if (aboutContent) {
      const contentElements = aboutContent.querySelectorAll('h2, .subtitle, p, .about-stats, .mt-lg');
      gsap.to(contentElements, { 
        opacity: 1, y: 0,
        duration: 0.8, ease: 'expo.out', stagger: 0.06,
        scrollTrigger: { trigger: '.about', start: 'top 95%', once: true }
      });
    }

    // Feature cards - smooth fade from below
    gsap.utils.toArray('.feature-card').forEach((card, i) => {
      gsap.to(card, { 
        opacity: 1, y: 0,
        duration: 0.75, ease: 'expo.out', delay: i * 0.06,
        scrollTrigger: { trigger: '.what-is .grid', start: 'top 95%', once: true }
      });
    });

    // Day cards - smooth fade from below
    gsap.utils.toArray('.day-card').forEach((card, i) => {
      gsap.to(card, { 
        opacity: 1, y: 0,
        duration: 0.7, ease: 'expo.out', delay: i * 0.05,
        scrollTrigger: { trigger: '.week-grid', start: 'top 95%', once: true }
      });
    });

    // Advantage cards - smooth fade from below
    gsap.utils.toArray('.advantage-card').forEach((card, i) => {
      gsap.to(card, { 
        opacity: 1, y: 0,
        duration: 0.75, ease: 'expo.out', delay: i * 0.06,
        scrollTrigger: { trigger: '.why-us .grid', start: 'top 95%', once: true }
      });
    });

    // Testimonial - smooth fade from below
    const testimonial = document.querySelector('.testimonial-card');
    if (testimonial) {
      gsap.to(testimonial, { 
        opacity: 1, y: 0,
        duration: 0.9, ease: 'expo.out',
        scrollTrigger: { trigger: testimonial, start: 'top 95%', once: true }
      });
    }

    // Steps - cascade scale pulse effect only
    const steps = gsap.utils.toArray('.step');
    if (steps.length) {
      ScrollTrigger.create({
        trigger: '.steps',
        start: 'top 95%',
        once: true,
        onEnter: () => {
          steps.forEach((step, i) => {
            // Scale up with pulse
            gsap.to(step, {
              opacity: 1,
              scale: 1,
              duration: 0.7,
              ease: 'expo.out',
              delay: i * 0.1,
              onComplete: () => {
                // Subtle pulse after scale
                gsap.to(step, {
                  scale: 1.03,
                  duration: 0.2,
                  ease: 'power2.out',
                  yoyo: true,
                  repeat: 1
                });
              }
            });
          });
        }
      });
    }

    // Pricing cards - smooth fade from below
    gsap.utils.toArray('.pricing-card').forEach((card, i) => {
      gsap.to(card, { 
        opacity: 1, y: 0,
        duration: 0.75, ease: 'expo.out', delay: i * 0.08,
        scrollTrigger: { trigger: '.pricing-grid', start: 'top 95%', once: true }
      });
    });

    // FAQ items - smooth fade from below with GSAP
    const faqItemsAnim = gsap.utils.toArray('.faq-item');
    if (faqItemsAnim.length) {
      ScrollTrigger.create({
        trigger: '.faq-list',
        start: 'top 95%',
        once: true,
        onEnter: () => {
          gsap.to(faqItemsAnim, { 
            opacity: 1, 
            y: 0,
            duration: 0.75, 
            ease: 'expo.out', 
            stagger: 0.06 
          });
        }
      });
    }

    // Final CTA - smooth fade from below
    const finalCta = document.querySelector('.final-cta');
    if (finalCta) {
      const finalH2 = finalCta.querySelector('h2');
      const finalOther = finalCta.querySelectorAll('p, .btn');
      
      if (finalH2) {
        gsap.to(finalH2, { 
          opacity: 1, y: 0, letterSpacing: '0em',
          duration: 0.9, ease: 'expo.out',
          scrollTrigger: { trigger: finalCta, start: 'top 95%', once: true }
        });
      }
      
      gsap.to(finalOther, { 
        opacity: 1, y: 0,
        duration: 0.75, ease: 'expo.out', stagger: 0.08, delay: 0.1,
        scrollTrigger: { trigger: finalCta, start: 'top 95%', once: true }
      });
    }

    // Background shapes parallax (отключаем на мобильных для плавности)
    if (!isMobile) {
      gsap.utils.toArray('.shape').forEach((shape, i) => {
        gsap.to(shape, {
          y: (i + 1) * 100,
          ease: 'none',
          scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 2
          }
        });
      });

      // Section parallax effects (selective - only on specific sections)
      gsap.utils.toArray('.about, .what-is, .why-us, .final-cta').forEach(section => {
        const content = section.querySelector('.container');
        if (content) {
          gsap.fromTo(content,
            { y: 20 },
            {
              y: -20,
              ease: 'none',
              scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.5
              }
            }
          );
        }
      });

      // Photo placeholder parallax
      const photoPlaceholder = document.querySelector('.photo-placeholder');
      if (photoPlaceholder) {
        gsap.to(photoPlaceholder, {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: '.about',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5
          }
        });
      }
    }

    // Cards parallax removed to prevent conflict with 3D hover tilt effect

  }

  /* ========== HEADER SCROLL EFFECT ========== */
  const header = document.querySelector('header');
  
  function updateHeader() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  /* ========== MOBILE MENU ========== */
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('nav');

  if (burger && nav) {
    burger.addEventListener('click', function() {
      const isActive = burger.classList.toggle('active');
      nav.classList.toggle('active');
      burger.setAttribute('aria-expanded', isActive);
      burger.setAttribute('aria-label', isActive ? 'Закрыть меню' : 'Открыть меню');
    });

    // Close menu when clicking any link (nav links or contact links)
    nav.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        burger.classList.remove('active');
        nav.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Открыть меню');
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (nav.classList.contains('active') && !nav.contains(e.target) && !burger.contains(e.target)) {
        burger.classList.remove('active');
        nav.classList.remove('active');
      }
    });
  }

  /* ========== SMOOTH SCROLL FOR ANCHOR LINKS ========== */
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      
      if (target) {
        const headerOffset = 90;

        if (window.lenis) {
          // Use Lenis for smooth scrolling
          window.lenis.scrollTo(target, { 
            offset: -headerOffset, 
            duration: 1.8,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });
        } else {
          // Fallback to native smooth scroll
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  /* ========== MODAL ========== */
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modalClose');
  const openModalBtns = document.querySelectorAll('.open-modal');
  const tariffOptions = document.querySelectorAll('.tariff-option');
  const payBtn = document.getElementById('payBtn');

  let savedScrollPosition = 0;

  function openModal() {
    if (modal) {
      // Очищаем ошибки валидации
      clearFieldError('telegramUsername', 'telegramUsernameError');
      clearFieldError('userEmail', 'userEmailError');
      clearFieldError('privacyAgreement', 'privacyAgreementError');
      
      // Сохраняем текущую позицию скролла
      savedScrollPosition = window.scrollY || window.pageYOffset;
      
      // Блокируем скролл без изменения позиции body
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.documentElement.style.overflow = 'hidden';
      
      modal.classList.add('active');
      if (window.lenis) window.lenis.stop();
      
      // Инициализация Lenis для модального окна
      const modalBox = modal.querySelector('.modal-box');
      if (modalBox && typeof Lenis !== 'undefined') {
        // Создаем отдельный Lenis для модального окна
        const modalLenis = new Lenis({
          wrapper: modalBox,
          content: modalBox,
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 2,
        });
        
        // RAF loop для модального Lenis
        function raf(time) {
          modalLenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        
        // Сохраняем для удаления при закрытии
        modalBox._modalLenis = modalLenis;
      } else if (modalBox) {
        // Fallback: обработка скролла колесиком мыши для модального окна
        const handleWheel = function(e) {
          const element = modalBox;
          const isScrollable = element.scrollHeight > element.clientHeight;
          
          if (!isScrollable) {
            return;
          }
          
          const isAtTop = element.scrollTop <= 0;
          const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
          
          // Если скроллим вверх и уже наверху, или вниз и уже внизу - предотвращаем
          if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
            e.preventDefault();
            return;
          }
          
          // Иначе позволяем скроллить модальное окно
          element.scrollTop += e.deltaY;
          e.preventDefault();
        };
        
        modalBox.addEventListener('wheel', handleWheel, { passive: false });
        modalBox._wheelHandler = handleWheel;
      }
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      
      // Удаляем Lenis или обработчик wheel
      const modalBox = modal.querySelector('.modal-box');
      if (modalBox) {
        if (modalBox._modalLenis) {
          modalBox._modalLenis.destroy();
          delete modalBox._modalLenis;
        }
        if (modalBox._wheelHandler) {
          modalBox.removeEventListener('wheel', modalBox._wheelHandler);
          delete modalBox._wheelHandler;
        }
        // Сбрасываем скролл внутри модалки
        modalBox.scrollTop = 0;
      }
      
      // Восстанавливаем скролл страницы
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overflow = '';
      
      // Восстанавливаем позицию без анимации
      if (window.lenis) {
        window.lenis.start();
        // Немедленно устанавливаем позицию для Lenis
        window.lenis.scrollTo(savedScrollPosition, { immediate: true });
      } else {
        window.scrollTo(0, savedScrollPosition);
      }
    }
  }

  openModalBtns.forEach(function(btn) {
    btn.addEventListener('click', openModal);
  });

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeModal();
    }
  });

  tariffOptions.forEach(function(option) {
    option.addEventListener('click', function() {
      tariffOptions.forEach(function(opt) {
        opt.classList.remove('active');
      });
      option.classList.add('active');
    });
  });

  /* ========== ВАЛИДАЦИЯ ФОРМЫ ========== */
  
  function validateTelegramUsername(username) {
    if (!username || !username.trim()) {
      return { valid: false, message: 'Telegram username обязателен для заполнения' };
    }
    
    // Убираем @ если пользователь его ввел
    const cleanUsername = username.trim().replace(/^@+/, '');
    
    if (cleanUsername.length < 3) {
      return { valid: false, message: 'Username должен содержать минимум 3 символа' };
    }
    
    if (cleanUsername.length > 32) {
      return { valid: false, message: 'Username не может быть длиннее 32 символов' };
    }
    
    // Telegram username может содержать только буквы, цифры и подчеркивание
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return { valid: false, message: 'Username может содержать только буквы, цифры и подчеркивание' };
    }
    
    return { valid: true, value: cleanUsername };
  }
  
  function validateEmail(email) {
    if (!email || !email.trim()) {
      return { valid: false, message: 'Email обязателен для получения чека об оплате' };
    }
    
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(cleanEmail)) {
      return { valid: false, message: 'Введите корректный email адрес' };
    }
    
    // Дополнительная проверка длины
    if (cleanEmail.length > 254) {
      return { valid: false, message: 'Email слишком длинный' };
    }
    
    return { valid: true, value: cleanEmail };
  }
  
  function showFieldError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(errorId);
    
    if (input && errorElement) {
      input.classList.add('error');
      input.classList.remove('valid');
      errorElement.textContent = message;
      // Используем setTimeout для плавной анимации
      setTimeout(() => {
        errorElement.classList.add('show');
      }, 10);
    }
  }
  
  function showFieldValid(inputId, errorId) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(errorId);
    
    if (input && errorElement) {
      input.classList.remove('error');
      input.classList.add('valid');
      errorElement.classList.remove('show');
      // Очищаем текст после анимации
      setTimeout(() => {
        errorElement.textContent = '';
      }, 300);
    }
  }
  
  function clearFieldError(inputId, errorId) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(errorId);
    
    if (input && errorElement) {
      input.classList.remove('error', 'valid');
      errorElement.classList.remove('show');
      // Очищаем текст после анимации
      setTimeout(() => {
        errorElement.textContent = '';
      }, 300);
    }
  }
  
  // Валидация в реальном времени
  const telegramUsernameInput = document.getElementById('telegramUsername');
  const userEmailInput = document.getElementById('userEmail');
  
  if (telegramUsernameInput) {
    telegramUsernameInput.addEventListener('input', function() {
      const value = this.value;
      if (value.trim()) {
        const validation = validateTelegramUsername(value);
        if (validation.valid) {
          showFieldValid('telegramUsername', 'telegramUsernameError');
        } else {
          showFieldError('telegramUsername', 'telegramUsernameError', validation.message);
        }
      } else {
        clearFieldError('telegramUsername', 'telegramUsernameError');
      }
    });
    
    telegramUsernameInput.addEventListener('blur', function() {
      const value = this.value;
      if (value.trim()) {
        const validation = validateTelegramUsername(value);
        if (!validation.valid) {
          showFieldError('telegramUsername', 'telegramUsernameError', validation.message);
        }
      }
    });
  }
  
  if (userEmailInput) {
    userEmailInput.addEventListener('input', function() {
      const value = this.value;
      if (value.trim()) {
        const validation = validateEmail(value);
        if (validation.valid) {
          showFieldValid('userEmail', 'userEmailError');
        } else {
          showFieldError('userEmail', 'userEmailError', validation.message);
        }
      } else {
        clearFieldError('userEmail', 'userEmailError');
      }
    });
    
    userEmailInput.addEventListener('blur', function() {
      const value = this.value;
      if (value.trim()) {
        const validation = validateEmail(value);
        if (!validation.valid) {
          showFieldError('userEmail', 'userEmailError', validation.message);
        }
      }
    });
  }
  
  // Валидация чекбокса согласия
  const privacyAgreementInput = document.getElementById('privacyAgreement');
  if (privacyAgreementInput) {
    privacyAgreementInput.addEventListener('change', function() {
      if (this.checked) {
        showFieldValid('privacyAgreement', 'privacyAgreementError');
      } else {
        clearFieldError('privacyAgreement', 'privacyAgreementError');
      }
    });
  }

  if (payBtn) {
    payBtn.addEventListener('click', function() {
      const selectedTariff = document.querySelector('.tariff-option.active');
      const telegramUsername = document.getElementById('telegramUsername');
      const userEmail = document.getElementById('userEmail');
      
      if (!selectedTariff) {
        alert('Пожалуйста, выберите тариф');
        return;
      }
      
      // Валидация Telegram username
      const usernameValidation = validateTelegramUsername(telegramUsername?.value || '');
      if (!usernameValidation.valid) {
        showFieldError('telegramUsername', 'telegramUsernameError', usernameValidation.message);
        telegramUsername?.focus();
        return;
      }
      
      // Валидация Email
      const emailValidation = validateEmail(userEmail?.value || '');
      if (!emailValidation.valid) {
        showFieldError('userEmail', 'userEmailError', emailValidation.message);
        userEmail?.focus();
        return;
      }
      
      // Валидация чекбокса согласия
      const privacyAgreement = document.getElementById('privacyAgreement');
      if (!privacyAgreement || !privacyAgreement.checked) {
        showFieldError('privacyAgreement', 'privacyAgreementError', 'Необходимо согласие с политикой конфиденциальности');
        privacyAgreement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      
      const tariffId = selectedTariff.getAttribute('data-tariff');
      const tariffPrices = {
        '1': 990,
        '3': 2490,
        '12': 8990
      };
      
      // Отправляем данные на сервер для создания платежа
      createPayment({
        tariff: tariffId,
        username: usernameValidation.value,
        email: emailValidation.value,
        amount: tariffPrices[tariffId]
      });
    });
  }
  
  // Функция создания платежа
  async function createPayment(data) {
    try {
      payBtn.disabled = true;
      payBtn.textContent = 'Создание платежа...';
      
      // ВАЖНО: Замените на URL вашего backend API
      // Пример: 'https://your-site.com/api/create-payment'
      const response = await fetch('https://your-site.com/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success && result.paymentUrl) {
        // Редирект на страницу оплаты
        window.location.href = result.paymentUrl;
      } else {
        throw new Error(result.error || 'Ошибка создания платежа');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Произошла ошибка. Пожалуйста, попробуйте позже.');
      payBtn.disabled = false;
      payBtn.textContent = 'Оплатить и получить доступ';
    }
  }
  
  // Обработка возврата после оплаты (если есть параметр success в URL)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('payment') === 'success') {
    // Показываем сообщение об успехе
    setTimeout(() => {
      alert('Оплата успешна! Проверьте Telegram - вы получите приглашение в канал.');
    }, 500);
  } else if (urlParams.get('payment') === 'failed') {
    setTimeout(() => {
      alert('Оплата не была завершена. Попробуйте еще раз.');
    }, 500);
  }

  /* ========== FAQ ACCORDION ========== */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function(item) {
    const question = item.querySelector('.faq-question');
    
    if (question) {
      question.addEventListener('click', function() {
        const isActive = item.classList.contains('active');
        
        // Close all other items
        faqItems.forEach(function(otherItem) {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });
        
        // Toggle current item
        if (isActive) {
          item.classList.remove('active');
        } else {
          item.classList.add('active');
        }
      });
    }
  });

  /* ========== HOVER EFFECTS (only if GSAP available) ========== */
  if (typeof gsap !== 'undefined') {
    // Floating button effect - only vertical movement
    document.querySelectorAll('.btn-primary, .btn-secondary, .btn-ghost').forEach(function(btn) {
      let floatingAnimation = null;
      
      btn.addEventListener('mouseenter', function() {
        // Плавная floating анимация вверх-вниз
        floatingAnimation = gsap.to(btn, {
          y: -4,
          duration: 1.2,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1
        });
      });
      
      btn.addEventListener('mouseleave', function() {
        if (floatingAnimation) {
          floatingAnimation.kill();
        }
        gsap.to(btn, {
          y: 0,
          duration: 0.4,
          ease: 'power2.out'
        });
      });
    });

    // Card tilt effect - direct and responsive with dynamic light reflection
    document.querySelectorAll('.feature-card, .advantage-card, .pricing-card, .day-card').forEach(function(card) {
      // Check if this is a featured pricing card
      const isFeatured = card.classList.contains('featured');
      const baseScale = isFeatured ? 1.05 : 1;
      
      // Set initial transform to prevent first-hover delay
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(${baseScale})`;
      card.style.transformStyle = 'preserve-3d';
      card.style.willChange = 'transform';
      
      // Set CSS custom properties for light reflection position (opposite to tilt)
      card.style.setProperty('--light-x', '50%');
      card.style.setProperty('--light-y', '0%');
      
      function updateCard(e) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate rotation - responsive tilt
        const rotateX = -(y - centerY) / 16.85;
        const rotateY = (x - centerX) / 16.85;
        
        // Light reflection position - opposite to cursor for realistic effect
        // When card tilts towards cursor, light appears on opposite side
        const lightX = 100 - (x / rect.width) * 100;
        const lightY = 100 - (y / rect.height) * 100;
        card.style.setProperty('--light-x', lightX + '%');
        card.style.setProperty('--light-y', lightY + '%');
        
        // Apply transform directly for instant response
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(${baseScale * 1.02})`;
      }
      
      card.addEventListener('mouseenter', function(e) {
        // Remove transition for instant response
        card.style.transition = 'none';
        updateCard(e);
      }, { passive: true });
      
      card.addEventListener('mousemove', updateCard, { passive: true });
      
      card.addEventListener('mouseleave', function() {
        // Re-enable transition for smooth return
        card.style.transition = 'transform 0.3s ease-out';
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(${baseScale})`;
        // Reset light position
        card.style.setProperty('--light-x', '50%');
        card.style.setProperty('--light-y', '0%');
      }, { passive: true });
    });
  }

  /* ========== ACTIVE NAVIGATION ========== */
  {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    const logo = document.querySelector('header .logo');
    const sections = document.querySelectorAll('section[id]');
    
    function updateActiveNav() {
      const scrollPos = window.scrollY + 150; // Offset for better UX
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Check if we're at the bottom of the page
      const isAtBottom = (window.scrollY + windowHeight) >= (documentHeight - 50);
      
      let activeFound = false;
      
      // Iterate sections in reverse to find the last visible one
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        // Check if this section is in view
        const isInView = scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight;
        
        if (isInView && !activeFound) {
          activeFound = true;
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${sectionId}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
          
          // Handle logo active state for hero section
          if (logo) {
            if (sectionId === 'hero') {
              logo.classList.add('active');
            } else {
              logo.classList.remove('active');
            }
          }
        }
      }
      
      // If no section is active (scrolled past all sections), remove all active states
      if (!activeFound || isAtBottom) {
        // Check if we're past the last section
        const lastSection = sections[sections.length - 1];
        if (lastSection) {
          const lastSectionBottom = lastSection.offsetTop + lastSection.offsetHeight;
          if (scrollPos > lastSectionBottom) {
            navLinks.forEach(link => {
              link.classList.remove('active');
            });
            if (logo) logo.classList.remove('active');
          }
        }
      }
      
      // Handle hero section (at the top)
      if (window.scrollY < 100) {
        navLinks.forEach(link => {
          link.classList.remove('active');
        });
        if (logo) logo.classList.add('active');
      }
    }
    
    // Update on scroll
    if (lenis) {
      lenis.on('scroll', updateActiveNav);
    } else {
      window.addEventListener('scroll', updateActiveNav, { passive: true });
    }
    
    // Initial update
    updateActiveNav();
  }

  /* ========== CANVAS PARTICLES ========== */
  {
    const canvas = document.getElementById('particles-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      let W, H;
      const particles = [];
      const particleCount = 85;
      
      // Accent color from CSS
      const accentColor = { r: 201, g: 165, b: 92 };
      
      function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
      }
      window.addEventListener('resize', resize);
      resize();
      
      class Particle {
        constructor() {
          this.reset();
        }
        
        reset() {
          // Ensure particles are distributed evenly across entire screen including center
          this.x = Math.random() * W;
          this.y = Math.random() * H;
          // Very slow, smooth movement - ensure movement in all directions
          this.vx = (Math.random() - 0.5) * 0.3;
          this.vy = (Math.random() - 0.5) * 0.3;
          // Varied sizes (1.5 to 4.5)
          this.radius = 1.5 + Math.random() * 3;
          // Base opacity varies
          this.baseOpacity = 0.15 + Math.random() * 0.35;
          this.opacity = this.baseOpacity;
          // Smooth direction change timing
          this.directionChangeTime = 200 + Math.random() * 400;
          this.directionTimer = Math.random() * this.directionChangeTime;
          // Target velocity for smooth transitions
          this.targetVx = this.vx;
          this.targetVy = this.vy;
          // Twinkling effect - some particles will fade in/out
          this.hasTwinkle = Math.random() < 0.65; // 65% of particles will twinkle
          this.twinklePhase = Math.random() * Math.PI * 2; // Random starting phase
          this.twinkleSpeed = 0.002 + Math.random() * 0.003; // Varying twinkle speed
        }
        
        update() {
          // Smooth direction changes
          this.directionTimer++;
          if (this.directionTimer >= this.directionChangeTime) {
            this.directionTimer = 0;
            this.directionChangeTime = 200 + Math.random() * 400;
            // New random target direction (very slow)
            this.targetVx = (Math.random() - 0.5) * 0.3;
            this.targetVy = (Math.random() - 0.5) * 0.3;
          }
          
          // Smooth interpolation to target velocity (no sharp turns)
          this.vx += (this.targetVx - this.vx) * 0.01;
          this.vy += (this.targetVy - this.vy) * 0.01;
          
          // Update position
          this.x += this.vx;
          this.y += this.vy;
          
          // Wrap around edges smoothly - ensure particles stay evenly distributed
          if (this.x < 0) this.x = W;
          if (this.x > W) this.x = 0;
          if (this.y < 0) this.y = H;
          if (this.y > H) this.y = 0;
          
          // Opacity fluctuation
          if (this.hasTwinkle) {
            // Twinkling particles: smooth, prolonged fade in and out
            // Use a slower, more stretched sine wave for longer invisible periods
            const time = Date.now() * this.twinkleSpeed * 0.5 + this.twinklePhase;
            let twinkleValue = Math.sin(time);
            // Stretch the bottom part (negative values) to make invisible periods longer
            // Transform: compress positive values, stretch negative values
            if (twinkleValue < 0) {
              // Stretch negative values (invisible period) - make them last longer
              twinkleValue = Math.pow(Math.abs(twinkleValue), 0.3) * -1;
            } else {
              // Compress positive values (visible period) - make them shorter
              twinkleValue = Math.pow(twinkleValue, 1.5);
            }
            // Map from -1 to 1 range to 0 to baseOpacity range for smooth fade
            this.opacity = (twinkleValue + 1) * 0.5 * this.baseOpacity;
          } else {
            // Non-twinkling particles: gentle fluctuation
            this.opacity = this.baseOpacity + Math.sin(Date.now() * 0.001 + this.x * 0.01) * 0.1;
          }
        }
        
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, ${Math.max(0, this.opacity)})`;
          ctx.fill();
        }
      }
      
      // Create particles
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
      
      function dist(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
      }
      
      function animate() {
        ctx.clearRect(0, 0, W, H);
        
        // Update all particles first
        particles.forEach(p => {
          p.update();
        });
        
        // Draw connections between particles (based on both distance and opacity)
        for (let i = 0; i < particleCount; i++) {
          for (let j = i + 1; j < particleCount; j++) {
            const p1 = particles[i];
            const p2 = particles[j];
            const distance = dist(p1, p2);
            
            if (distance < 150) {
              // Connection opacity based on distance AND both particles' opacity
              const distanceAlpha = (1 - distance / 150) * 0.3;
              const combinedOpacity = Math.min(p1.opacity, p2.opacity);
              const alpha = distanceAlpha * (combinedOpacity / 0.5); // Scale by particle visibility
              
              if (alpha > 0.01) {
                ctx.strokeStyle = `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            }
          }
        }
        
        // Draw all particles
        particles.forEach(p => {
          p.draw();
        });
        
        requestAnimationFrame(animate);
      }
      
      animate();
    }
  }

  /* ========== ORIENTATION OVERLAY NETWORK ANIMATION ========== */
  {
    const canvas = document.getElementById('network-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      let W, H;
      const particles = [];
      const particleCount = 95;
      const accentColor = { r: 201, g: 165, b: 92 }; // var(--accent)
      
      function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
      }
      window.addEventListener('resize', resize);
      resize();
      
      class NetworkParticle {
        constructor() {
          this.x = Math.random() * W;
          this.y = Math.random() * H;
          this.vx = (Math.random() - 0.5) * 0.5;
          this.vy = (Math.random() - 0.5) * 0.5;
          this.radius = 2;
        }
        
        update() {
          this.x += this.vx;
          this.y += this.vy;
          
          if (this.x < 0 || this.x > W) this.vx *= -1;
          if (this.y < 0 || this.y > H) this.vy *= -1;
        }
        
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, 0.8)`;
          ctx.fill();
        }
      }
      
      for (let i = 0; i < particleCount; i++) {
        particles.push(new NetworkParticle());
      }
      
      let mouse = { x: null, y: null };
      canvas.addEventListener('touchmove', function(e) {
        if (e.touches[0]) {
          mouse.x = e.touches[0].clientX;
          mouse.y = e.touches[0].clientY;
        }
      }, { passive: true });
      
      canvas.addEventListener('touchend', function() {
        mouse.x = null;
        mouse.y = null;
      });
      
      function dist(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
      }
      
      function animateNetwork() {
        ctx.clearRect(0, 0, W, H);
        
        particles.forEach(p => {
          p.update();
          p.draw();
        });
        
        // Draw connections between particles
        for (let i = 0; i < particleCount; i++) {
          for (let j = i + 1; j < particleCount; j++) {
            const p1 = particles[i];
            const p2 = particles[j];
            const distance = dist(p1, p2);
            
            if (distance < 120) {
              let alpha = (1 - distance / 120) * 0.4;
              
              // Enhance line if touch is close
              if (mouse.x !== null) {
                const distToMouse1 = dist(p1, mouse);
                const distToMouse2 = dist(p2, mouse);
                if (distToMouse1 < 80 || distToMouse2 < 80) {
                  alpha = Math.min(0.8, alpha + 0.4);
                }
              }
              
              ctx.strokeStyle = `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, ${alpha})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
        
        requestAnimationFrame(animateNetwork);
      }
      
      animateNetwork();
    }
  }

  /* ========== EXIT INTENT POPUP ========== */
  {
    const exitPopup = document.getElementById('exitPopup');
    const exitPopupClose = document.getElementById('exitPopupClose');
    let isPopupShowing = false;
    const maxShows = 2; // Максимум показов за сессию
    
    function showExitPopup() {
      if (!exitPopup || isPopupShowing) return;
      
      // Получаем текущее количество показов
      const showCount = parseInt(sessionStorage.getItem('exitPopupShowCount') || '0');
      
      // Если уже показали максимальное количество раз - не показываем
      if (showCount >= maxShows) return;
      
      isPopupShowing = true;
      exitPopup.classList.add('active');
      exitPopup.setAttribute('aria-hidden', 'false');
      
      // Увеличиваем счетчик показов
      sessionStorage.setItem('exitPopupShowCount', (showCount + 1).toString());
    }
    
    function hideExitPopup() {
      if (!exitPopup) return;
      isPopupShowing = false;
      exitPopup.classList.remove('active');
      exitPopup.setAttribute('aria-hidden', 'true');
    }
    
    // Exit intent detection - отслеживаем движение мыши к верхнему краю
    let mouseY = 0;
    document.addEventListener('mousemove', function(e) {
      mouseY = e.clientY;
    }, { passive: true });
    
    document.addEventListener('mouseleave', function(e) {
      // Если мышь покинула окно через верхний край и пользователь прокрутил страницу
      if (e.clientY <= 0 && window.scrollY > 100) {
        showExitPopup();
      }
    }, { passive: true });
    
    // Закрытие popup
    if (exitPopupClose) {
      exitPopupClose.addEventListener('click', hideExitPopup);
    }
    
    if (exitPopup) {
      exitPopup.addEventListener('click', function(e) {
        if (e.target === exitPopup) {
          hideExitPopup();
        }
      });
    }
    
    // При клике на кнопку в popup открываем модальное окно и закрываем popup
    if (exitPopup) {
      const popupBtn = exitPopup.querySelector('.open-modal');
      if (popupBtn) {
        popupBtn.addEventListener('click', function() {
          hideExitPopup();
        });
      }
    }
    
    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && exitPopup && exitPopup.classList.contains('active')) {
        hideExitPopup();
      }
    });
  }

});

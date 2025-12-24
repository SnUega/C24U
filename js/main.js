document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  /* ========== LENIS + GSAP SCROLLTRIGGER INTEGRATION ========== */
  
  // Initialize GSAP first
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('GSAP or ScrollTrigger not loaded');
    return;
  }
  
  gsap.registerPlugin(ScrollTrigger);
  
  // Initialize Lenis
  let lenis = null;
  
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.6,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });
    
    // CRITICAL: Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    
    // CRITICAL: Use GSAP ticker for Lenis RAF loop (prevents conflicts)
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    
    // Disable GSAP's lag smoothing for better sync
    gsap.ticker.lagSmoothing(0);
    
    // Store globally
    window.lenis = lenis;
    
    console.log('Lenis + ScrollTrigger integrated successfully');
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

    // Background shapes parallax
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

    // Cards subtle parallax (excluding day-cards to prevent weird behavior)
    gsap.utils.toArray('.feature-card, .pricing-card').forEach((card, i) => {
      gsap.to(card, {
        y: -10 - (i % 3) * 3,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2.5
        }
      });
    });

    console.log('GSAP animations initialized');
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
  
  window.addEventListener('scroll', updateHeader);
  updateHeader();

  /* ========== MOBILE MENU ========== */
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('nav');

  if (burger && nav) {
    burger.addEventListener('click', function() {
      burger.classList.toggle('active');
      nav.classList.toggle('active');
    });

    // Close menu when clicking any link (nav links or contact links)
    nav.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        burger.classList.remove('active');
        nav.classList.remove('active');
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

  function openModal() {
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (window.lenis) window.lenis.stop();
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      if (window.lenis) window.lenis.start();
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

  if (payBtn) {
    payBtn.addEventListener('click', function() {
      const selectedTariff = document.querySelector('.tariff-option.active');
      const telegramUsername = document.getElementById('telegramUsername');
      
      if (!selectedTariff) {
        alert('Пожалуйста, выберите тариф');
        return;
      }
      
      if (!telegramUsername || !telegramUsername.value.trim()) {
        alert('Пожалуйста, введите ваш Telegram username');
        telegramUsername?.focus();
        return;
      }
      
      // Убираем @ если пользователь его ввел
      const username = telegramUsername.value.trim().replace('@', '');
      
      if (!username || username.length < 3) {
        alert('Пожалуйста, введите корректный Telegram username');
        telegramUsername?.focus();
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
        username: username,
        amount: tariffPrices[tariffId]
      });
    });
  }
  
  // Функция создания платежа
  async function createPayment(data) {
    try {
      payBtn.disabled = true;
      payBtn.textContent = 'Создание платежа...';
      
      // TODO: Замените на URL вашего backend
      const response = await fetch('https://your-backend-url.com/api/create-payment', {
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
    // Magnetic button effect
    document.querySelectorAll('.btn-primary').forEach(function(btn) {
      btn.addEventListener('mousemove', function(e) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(btn, {
          x: x * 0.15,
          y: y * 0.15,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
      
      btn.addEventListener('mouseleave', function() {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.4)'
        });
      });
    });

    // Card tilt effect
    document.querySelectorAll('.feature-card, .advantage-card, .pricing-card, .day-card').forEach(function(card) {
      card.addEventListener('mousemove', function(e) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 25;
        const rotateY = (centerX - x) / 25;
        
        gsap.to(card, {
          rotateX: rotateX,
          rotateY: rotateY,
          transformPerspective: 1000,
          duration: 0.4,
          ease: 'power2.out'
        });
      });
      
      card.addEventListener('mouseleave', function() {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.6,
          ease: 'power2.out'
        });
      });
    });
  }

  console.log('C2 4U Landing initialized successfully');
});

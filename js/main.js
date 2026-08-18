/* ============================================================
   СТРОЙЛИДЫ — js/main.js
   Оживляем лендинг: меню, табы, скролл-анимации,
   счётчики, калькулятор выгоды и форма захвата.
   ============================================================ */
'use strict';

(() => {
  document.documentElement.classList.add('js');
  /* ---------- 0. ПОМОЩНИКИ ---------- */
  const byId = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmtInt = new Intl.NumberFormat('ru-RU');
  const fmtDec = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
  const money  = (v) => `${fmtInt.format(Math.round(v))} ₽`;

  /* ============================================================
     1. ШАПКА: фон при скролле + полоса прогресса чтения
     ============================================================ */
  const header   = byId('header');
  const progress = document.querySelector('.progress');
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('header--scrolled', window.scrollY > 10);

      const total = document.documentElement.scrollHeight - window.innerHeight;
      const done  = total > 0 ? (window.scrollY / total) * 100 : 0;
      progress.style.width = `${done}%`;
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============================================================
     2. МОБИЛЬНОЕ МЕНЮ (бургер)
     ============================================================ */
  const burger = document.querySelector('.burger');
  const nav    = byId('site-nav');

  function setMenu(open) {
    burger.classList.toggle('burger--active', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('nav--open', open);
    document.body.classList.toggle('page--menu', open);
  }

  burger.addEventListener('click', () => setMenu(!nav.classList.contains('nav--open')));

  // Закрытие: клик по пункту меню, клик по затемнению, клавиша Esc
  nav.addEventListener('click', (e) => {
    if (e.target.closest('.nav__link')) setMenu(false);
  });
  document.addEventListener('click', (e) => {
    if (document.body.classList.contains('page--menu') && e.target === document.body) {
      setMenu(false);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  /* ============================================================
     3. ПЛАВНЫЙ СКРОЛЛ для кнопок с data-goto
     ============================================================ */
  document.querySelectorAll('[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.goto);
      if (!target) return;
      setMenu(false);
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ============================================================
     4. АКТИВНЫЙ ПУНКТ МЕНЮ при скролле
     ============================================================ */
  const sectionIds = ['problems', 'ecosystem', 'workflow', 'calc', 'contact'];
  const linkMap = new Map(
    [...document.querySelectorAll('.nav__link')].map((a) => [a.getAttribute('href').slice(1), a])
  );

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        document.querySelectorAll('.nav__link--current')
          .forEach((a) => a.classList.remove('nav__link--current'));
        const link = linkMap.get(entry.target.id);
        if (link) link.classList.add('nav__link--current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sectionIds.forEach((id) => {
      const el = byId(id);
      if (el) spy.observe(el);
    });
  }

  /* ============================================================
     5. ПОЯВЛЕНИЕ БЛОКОВ ПРИ СКРОЛЛЕ (.reveal)
     ============================================================ */
  const reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealIO.unobserve(entry.target); // анимируем один раз
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

    reveals.forEach((el) => revealIO.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ============================================================
     6. СЧЁТЧИКИ В HERO (35 ₽, ×3, 24/7)
     ============================================================ */
  const counters = document.querySelectorAll('[data-count]');

  function runCounter(el) {
    const target = parseFloat(el.dataset.count);
    if (reduceMotion) { el.textContent = fmtInt.format(target); return; }

    const duration = 1300;
    const start = performance.now();

    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // плавное замедление
      el.textContent = fmtInt.format(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          countIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => countIO.observe(el));
  } else {
    counters.forEach(runCounter);
  }

  /* ============================================================
     7. ТАБЫ ЭКОСИСТЕМЫ (клик + стрелки клавиатуры)
     ============================================================ */
  const tabs   = [...document.querySelectorAll('.ecosystem__tab')];
  const panels = [...document.querySelectorAll('.ecosystem__panel')];

  function activateTab(tab, needFocus = false) {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
    });
    panels.forEach((p) => {
      const active = p.id === tab.getAttribute('aria-controls');
      p.classList.toggle('is-active', active);
      p.hidden = !active;
    });
    if (needFocus) tab.focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(tab));

    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End')  next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); activateTab(next, true); }
    });
  });

   /* ============================================================
  8. КАЛЬКУЛЯТОР ВЫГОДЫ (УМНЫЙ И КОНСЕРВАТИВНЫЙ)
  ============================================================ */
  const calc = {
    leads: byId('calc-leads'),
    conv: byId('calc-conv'),
    check: byId('calc-check'),
    out: {
      leads: byId('out-leads'),
      conv: byId('out-conv'),
      check: byId('out-check'),
    },
    res: {
      cost: byId('res-cost'),
      deals: byId('res-deals'),
      revenue: byId('res-revenue'),
      profit: byId('res-profit'),
      roi: byId('res-roi'),
      bar: byId('roi-bar'),
      verdict: byId('res-verdict'),
    },
  };

  function updateCalc() {
    const leads = +calc.leads.value;
    const conv = +calc.conv.value;
    const check = +calc.check.value;
    
    // Динамическая стоимость контакта (20 или 60 рублей)
       // Динамическая стоимость контакта (20 или 60 рублей для партнеров)
    const selectedRateRadio = document.querySelector('input[name="service-rate"]:checked');
    const currentPricePerLead = selectedRateRadio ? +selectedRateRadio.value : 35; 


    // Подсветка активной плитки тарифа
    document.querySelectorAll('.calc__rate-label').forEach(label => {
      const radio = label.querySelector('input');
      if (radio && radio.checked) {
        label.style.borderColor = 'var(--orange)';
        label.style.backgroundColor = 'rgba(255, 107, 26, .08)';
      } else {
        label.style.borderColor = 'var(--line)';
        label.style.backgroundColor = 'rgba(14, 26, 63, .4)';
      }
    });

    // Анимация заполнения ползунков
    [calc.leads, calc.conv, calc.check].forEach((el) => {
      const p = ((+el.value - +el.min) / (+el.max - +el.min)) * 100;
      el.style.setProperty('--p', `${p}%`);
    });

    // Вывод текущих значений на экран
    calc.out.leads.textContent = fmtInt.format(leads);
    calc.out.conv.textContent = `${conv.toLocaleString('ru-RU')}%`;
    calc.out.check.textContent = money(check);

    // Математические расчеты
    const cost = leads * currentPricePerLead;
    const deals = (leads * conv) / 100;
    const revenue = deals * check;
    const profit = revenue - cost;
    const roi = cost > 0 ? revenue / cost : 0;

    // Заполнение правой панели калькулятора
    calc.res.cost.textContent = money(cost);
    calc.res.deals.textContent = fmtDec.format(deals);
    calc.res.revenue.textContent = money(revenue);
    calc.res.profit.textContent = money(profit);
    calc.res.roi.textContent = `×${fmtInt.format(Math.round(roi))}`;

    // Логарифмический индикатор окупаемости
    const width = Math.min(100, 6 + Math.log10(Math.max(roi, 1)) * 48);
    calc.res.bar.style.width = `${width}%`;

    // Динамический вердикт
    let verdict;
    if (profit <= 0) {
      verdict = 'При текущих вводных проект в минусе. Для окупаемости поднимите объем контактов или конверсию.';
    } else {
      verdict = `Даже при минимальной конверсии проект приносит прибыль. Плюс вы получаете полный срез рынка: точные причины, почему часть клиентов выбрала конкурентов (цены, сроки, опыт), что позволит докрутить ваш продукт.`;
    }
    calc.res.verdict.textContent = verdict;
  }

  // Привязка событий
  [calc.leads, calc.conv, calc.check].forEach((el) =>
    el.addEventListener('input', updateCalc)
  );
  
  document.querySelectorAll('input[name="service-rate"]').forEach((radio) =>
    radio.addEventListener('change', updateCalc)
  );

  updateCalc();


   /* ============================================================
   9. ФОРМА ЗАХВАТА (ОТПРАВКА В TELEGRAM)
   ============================================================ */
  const leadForm = byId('lead-form');
  const nameInp  = byId('f-name');
  const phoneInp = byId('f-phone');
  const success  = byId('form-success');
  const submit   = leadForm ? leadForm.querySelector('.form__submit') : null;

  // НАСТРОЙКИ TELEGRAM-БОТА
  
  // ✅ ПРАВИЛЬНЫЙ адрес Bot API (именно api.telegram.org + /bot<токен>/sendMessage)
 const TG_PROXY_URL = 'https://stroylidy-tg.sasha2kms.workers.dev';

  // Экранируем HTML, чтобы имя клиента не сломало разметку сообщения
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (phoneInp) {
    phoneInp.addEventListener('input', () => {
      phoneInp.value = phoneInp.value.replace(/[^\d+()\-\s]/g, '');
      phoneInp.classList.remove('form__input--error');
    });
  }
  if (nameInp) {
    nameInp.addEventListener('input', () => nameInp.classList.remove('form__input--error'));
  }

  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Ловушка для ботов
      if (leadForm.company && leadForm.company.value.trim() !== '') return;
      if (submit.disabled) return;

      let ok = true;
      if (nameInp.value.trim().length < 2) {
        nameInp.classList.add('form__input--error');
        ok = false;
      }
      if (phoneInp.value.replace(/\D/g, '').length < 10) {
        phoneInp.classList.add('form__input--error');
        ok = false;
      }
      if (leadForm.policy && !leadForm.policy.checked) {
        leadForm.policy.focus();
        ok = false;
      }
      if (!ok) return;

      submit.disabled = true;
      submit.textContent = 'Отправляем…';

      const name  = nameInp.value.trim();
      const phone = phoneInp.value.trim();
      const nicheSelect = byId('f-niche');
      const nicheText = nicheSelect ? nicheSelect.options[nicheSelect.selectedIndex].text : 'Не выбрана';

      let message = `🔥 <b>Новая заявка с сайта СтройЛиды</b>\n\n`;
      message += `👤 <b>Имя:</b> ${esc(name)}\n`;
      message += `📞 <b>Телефон:</b> ${esc(phone)}\n`;
      message += `💼 <b>Ниша:</b> ${esc(nicheText)}`;

       fetch(TG_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  })
        .then(async (response) => {
          const data = await response.json().catch(() => ({}));

          if (response.ok && data.ok) {
            leadForm.reset();
            success.hidden = false;
            success.style.color = '#8BEBB4';
            success.style.borderColor = 'rgba(56,224,123,.45)';
            success.textContent = '✅ Заявка успешно отправлена специалисту!';
            submit.textContent = 'Заявка отправлена ✓';
            success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            // Telegram вернул ошибку с описанием — выводим в консоль для отладки
            console.error('Telegram API:', data.description);
            submit.disabled = false;
            submit.textContent = 'Получить расчёт базы';
            success.hidden = false;
            success.style.color = '#FF5470';
            success.style.borderColor = 'rgba(255,84,112,.45)';

            if (data.description && data.description.includes('chat not found')) {
              success.textContent = '❌ Бот не активирован: откройте бота в Telegram и нажмите START.';
            } else if (data.description && data.description.includes('Unauthorized')) {
              success.textContent = '❌ Неверный токен бота. Проверьте TG_TOKEN.';
            } else {
              success.textContent = '❌ Ошибка Telegram: ' + (data.description || 'неизвестно');
            }
          }
        })
        .catch(() => {
          submit.disabled = false;
          submit.textContent = 'Получить расчёт базы';
          success.hidden = false;
          success.style.color = '#FF5470';
          success.style.borderColor = 'rgba(255,84,112,.45)';
          success.textContent = '❌ Ошибка сети. Проверьте подключение.';
        });
    });
  }



  /* ============================================================
     10. ПОДСКАЗКИ ТЕРМИНОВ на сенсорных экранах
     ============================================================ */
  document.querySelectorAll('.term').forEach((term) => {
    term.addEventListener('click', (e) => {
      e.stopPropagation();
      term.focus(); // на телефоне тап = фокус = подсказка видна
    });
  });
  document.addEventListener('click', () => {
    if (document.activeElement && document.activeElement.classList.contains('term')) {
      document.activeElement.blur();
    }
  });

  /* ============================================================
     11. ЛЁГКИЙ 3D-НАКЛОН картинки в HERO (только мышь)
     ============================================================ */
  const figure = document.querySelector('.hero__figure');

  if (figure && window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
    const frame = figure.querySelector('.hero__frame');
    figure.style.perspective = '900px';

    figure.addEventListener('mousemove', (e) => {
      const r = figure.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      frame.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });

    figure.addEventListener('mouseleave', () => {
      frame.style.transform = '';
    });
  }
   /* ============================================================
    /* ============================================================
  12. МОДАЛЬНЫЕ ОКНА (МУЛЬТИ-РЕЖИМ: РОБОТЫ + AI-АГЕНТЫ + ПОЛИТИКА)
  ============================================================ */
  const demoModal = byId('modal-demo');
  const aiModal = byId('modal-ai-demo');
  const policyModal = byId('modal-policy');
  
  const openDemoBtn = document.querySelector('.js-open-modal');
  const openAiDemoBtn = document.querySelector('.js-open-ai-modal');
  const openPolicyBtns = document.querySelectorAll('.js-open-policy');
  
  const closeBtns = document.querySelectorAll('.modal__close');
  const overlays = document.querySelectorAll('.modal__overlay');
  const allAudios = document.querySelectorAll('.player-card__audio');
  const modalCtaBtns = document.querySelectorAll('.js-modal-cta');

  // Функция планового открытия конкретного окна
  function openModal(targetModal) {
    if (!targetModal) return;
    targetModal.classList.add('modal--open');
    targetModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // стопорим скролл фона
    targetModal.querySelector('.modal__wrapper').classList.add('is-visible');
  }

  // Функция закрытия ВСЕХ окон
  function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => {
      m.classList.remove('modal--open');
      m.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
    
    // Мгновенно глушим все плееры во всех окнах при закрытии
    allAudios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  // Привязка триггеров открытия к кнопкам на табах
  if (openDemoBtn) openDemoBtn.addEventListener('click', () => openModal(demoModal));
  if (openAiDemoBtn) openAiDemoBtn.addEventListener('click', () => openModal(aiModal));

  // Привязка к ссылкам политики конфиденциальности
  openPolicyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(policyModal);
    });
  });

  // Логика кнопок "Хочу себе" (работает для обеих модалок)
  modalCtaBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals(); // 1. Закрываем текущее окно и тушим плееры
      
      // 2. Находим футер с формой и плавно летим к нему
      const contactSection = byId('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // 3. Автоматически ставим фокус на поле ввода имени
        setTimeout(() => {
          const nameInput = byId('f-name');
          if (nameInput) nameInput.focus();
        }, 800); // 800мс достаточно, чтобы скролл плавно доехал до низа
      }
    });
  });

  // Обработчики стандартного закрытия (крестик, клик по темному фону, кнопка Esc)
  closeBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
  overlays.forEach(overlay => overlay.addEventListener('click', closeAllModals));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });




})();
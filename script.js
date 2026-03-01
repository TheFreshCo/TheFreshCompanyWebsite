/* ================================================================
   THE FRESH COMPANY — script.js
   Estructura de módulos:
   1.  CONFIG GLOBAL — Constantes y configuración compartida
   2.  MÓDULO: Theme Toggle — Cambio de tema claro/oscuro
   3.  MÓDULO: Navbar — Scroll, activo por sección, hamburger
   4.  MÓDULO: Robot Guide — Guía animada que sigue el scroll
   5.  MÓDULO: Reveal on Scroll — Animación de entrada de secciones
   6.  MÓDULO: Stats Counter — Contadores animados de estadísticas
   7.  MÓDULO: Projects Slideshow — Slideshow de imágenes en tarjetas
   8.  MÓDULO: Contact Form — Validación y envío del formulario
   9.  MÓDULO: Footer — Año dinámico
   10. MODULO: Lang Toggle — Google Translate con fallback robusto
   11. INIT — Inicialización de todos los módulos al cargar
================================================================ */

'use strict';

/* ================================================================
   1. CONFIG GLOBAL
   Constantes reutilizables entre módulos.
================================================================ */
const CONFIG = {
  // Mensajes del robot según la sección activa
  robotMessages: {
    'presentacion':  '¡Bienvenido! 👋',
    'quienes-somos': 'Conócenos mejor.',
    'proyectos':     'Mira lo que hacemos.',
    'novedades':     'Últimas novedades.',
    'fundadores':    'El equipo detrás.',
    'contacto':      '¡Hablemos! 📩',
    'footer':        'Gracias por visitar.'
  },

  // Tiempo en ms que se muestra el mensaje del robot
  robotBubbleTimeout: 3000,

  // Intervalo (ms) entre cambios de imagen en proyectos
  projectSlideshowInterval: 2800,

  // Claves de localStorage para persistencia
  storageThemeKey: 'tfc-theme',

  // Secciones principales para el observer de navegación
  sections: ['presentacion','quienes-somos','proyectos','novedades','fundadores','contacto'],
};


/* ================================================================
   2. MÓDULO: THEME TOGGLE
   Maneja el cambio entre modo oscuro y modo claro.
   Persiste la preferencia en localStorage.
   Cambia el logo según el tema activo.
================================================================ */
const ThemeModule = (() => {

  // Referencias al DOM
  const html        = document.documentElement;
  const btn         = document.getElementById('theme-toggle');
  const navLogo     = document.getElementById('nav-logo-img');
  const footerLogo  = document.getElementById('footer-logo-img');

  /* DESPUÉS — logos de marca + imágenes del brazo robótico */
  const LOGOS = {
    dark:  'Logo_freshCompany_06_Dark_sin_fondo.png',
    light: 'Logo_freshCompany_06_white_sin_fondo.png',
  };

  /* Imágenes del brazo robótico por tema */
  const ROBOT_IMGS = {
    dark:  'Solo_brazo_dark_sin_fondo.png',
    light: 'Solo_brazo_white_sin_fondo.png',
  };

  /* Referencias al brazo en hero y en sidebar */
  const robotImg     = document.getElementById('robot-img');
  const heroRobotImg = document.getElementById('hero-robot-img');

  // Aplica el tema indicado al DOM y actualiza logos
  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);

    /* Logos de marca */
    if (navLogo)    navLogo.setAttribute('src', LOGOS[theme]);
    if (footerLogo) footerLogo.setAttribute('src', LOGOS[theme]);

    /* Brazo robótico — hero y sidebar */
    const rImg  = document.getElementById('robot-img');       /* Re-buscar en el DOM */
    const hImg  = document.getElementById('hero-robot-img'); /* por si Google lo movió */
    if (rImg) rImg.setAttribute('src', ROBOT_IMGS[theme]);
    if (hImg) hImg.setAttribute('src', ROBOT_IMGS[theme]);

    localStorage.setItem(CONFIG.storageThemeKey, theme);
  }

  // Obtiene el tema inicial: localStorage → preferencia del sistema → dark
  function getInitialTheme() {
    const saved = localStorage.getItem(CONFIG.storageThemeKey);
    if (saved === 'dark' || saved === 'light') return saved;
    // Detectar preferencia del sistema operativo
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  // Alterna entre los dos temas
  function toggle() {
    const current = html.getAttribute('data-theme') || 'dark';
    const next    = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    // Notificar al módulo del robot para actualizar color
    RobotModule.onThemeChange(next);
  }

  // Inicialización del módulo
  function init() {
    applyTheme(getInitialTheme());
    if (btn) btn.addEventListener('click', toggle);
  }

  return { init, applyTheme };
})();


/* ================================================================
   3. MÓDULO: NAVBAR
   Controla tres comportamientos:
   a) Clase "scrolled" al bajar de la posición inicial
   b) Link activo resaltado según la sección visible
   c) Menú hamburger en mobile (abrir/cerrar)
================================================================ */
const NavbarModule = (() => {

  const navbar    = document.getElementById('navbar');
  const links     = document.querySelectorAll('.nav-link');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');

  // Activa el link de navegación cuyo href corresponde a la sección
  function setActiveLink(sectionId) {
    links.forEach(link => {
      const isActive = link.getAttribute('href') === `#${sectionId}`;
      link.classList.toggle('active', isActive);
    });
  }

  // Cierra el menú mobile
  function closeMenu() {
    navLinks?.classList.remove('open');
    hamburger?.classList.remove('open');
  }

  // Inicialización
  function init() {
    // a) Detectar scroll para agregar clase "scrolled"
    window.addEventListener('scroll', () => {
      /* Con más de 80px de scroll la barra se vuelve transparente             */
      navbar?.classList.toggle('scrolled', window.scrollY > 80);
    }, { passive: true });

    // b) Hamburger toggle
    hamburger?.addEventListener('click', () => {
      const isOpen = navLinks?.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
    });

    // c) Cerrar menú al hacer clic en un link
    links.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // d) Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!navbar?.contains(e.target)) closeMenu();
    });
  }

  return { init, setActiveLink };
})();


/* ================================================================
   4. MÓDULO: ROBOT GUIDE
   Brazo robótico flotante que:
   - Detecta la sección activa y muestra un mensaje contextual
   - Realiza una animación de "saludo" al cambiar de sección
   - Actualiza su posición vertical relativa al scroll
   - Cambia de color automáticamente con las variables CSS del tema
================================================================ */
const RobotModule = (() => {

  const guide   = document.getElementById('robot-guide');
  const robotImg  = document.getElementById('robot-img');
  const bubble  = document.getElementById('robot-bubble');
  const message = document.getElementById('robot-message');

  let currentSection  = '';
  let bubbleTimer     = null;

  // Muestra el mensaje de burbuja y lo oculta después del timeout
  function showBubble(text) {
    if (!message || !bubble) return;
    message.textContent = text;
    bubble.classList.add('is-visible');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => {
      bubble.classList.remove('is-visible');
    }, CONFIG.robotBubbleTimeout);
  }

  // Activa la animación de saludo en el SVG
  function wave() {
    if (!robotImg) return;
    robotImg.classList.remove('robot-wave');
    void robotImg.offsetWidth;
    robotImg.classList.add('robot-wave');
    robotImg.addEventListener('animationend', () => {
      robotImg.classList.remove('robot-wave');
    }, { once: true });
  }

  // Llamado desde el ThemeModule cuando el tema cambia
  // No se necesita código adicional porque el color viene de CSS var(--accent)
  function onThemeChange(theme) {
    showBubble(theme === 'dark' ? '🌙 Modo oscuro' : '☀️ Modo claro');
    wave();
  }

  // Actualiza el robot cuando la sección activa cambia
  function onSectionChange(sectionId) {
    if (sectionId === currentSection) return;
    currentSection = sectionId;

    const msg = CONFIG.robotMessages[sectionId];
    if (msg) {
      wave();
      showBubble(msg);
    }

    // Notificar a la navbar
    NavbarModule.setActiveLink(sectionId);
  }

  function init() {
    const heroSection = document.getElementById('presentacion');
    const heroRobot   = document.getElementById('hero-robot');

    window.addEventListener('scroll', () => {
      if (!heroSection) return;

      const heroBottom = heroSection.getBoundingClientRect().bottom;

      if (heroBottom < 0) {
        /* Usuario salió del hero: ocultar brazo grande, mostrar guía lateral */
        heroRobot?.classList.add('is-hidden');
        guide?.classList.add('is-visible');

        /* Ajustar posición vertical del guía según el scroll */
        const scrollFraction = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        const bottomPos = 60 + scrollFraction * 100;
        if (guide) guide.style.bottom = `${bottomPos}px`;

      } else {
        /* Usuario está en el hero: mostrar brazo grande, ocultar guía lateral */
        heroRobot?.classList.remove('is-hidden');
        guide?.classList.remove('is-visible');
        bubble?.classList.remove('is-visible'); /* Ocultar burbuja también */
      }
    }, { passive: true });

    /* Mensaje de bienvenida al cargar */
    setTimeout(() => {
      showBubble(CONFIG.robotMessages['presentacion']);
    }, 1800);
  }

  return { init, onSectionChange, onThemeChange };
})();


/* ================================================================
   5. MÓDULO: REVEAL ON SCROLL
   Usa IntersectionObserver para animar la entrada de elementos
   con la clase .reveal cuando entran al viewport.
   También notifica al RobotModule qué sección está visible.
================================================================ */
const RevealModule = (() => {

  // Observer para elementos .reveal (animación de entrada)
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Agregar delay escalonado entre hermanos para efecto cascada
        const siblings = entry.target.parentElement?.querySelectorAll('.reveal');
        siblings?.forEach((el, i) => {
          if (el === entry.target) {
            el.style.transitionDelay = `${i * 80}ms`;
          }
        });
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px',
  });

  // Observer para detectar qué sección principal está en pantalla
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        RobotModule.onSectionChange(entry.target.id);
      }
    });
  }, {
    threshold: 0.35,
  });

  // Inicialización
  function init() {
    // Observar todos los elementos animables
    document.querySelectorAll('.reveal').forEach(el => {
      revealObserver.observe(el);
    });

    // Observar las secciones principales para detectar la activa
    CONFIG.sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  return { init };
})();


/* ================================================================
   6. MÓDULO: STATS COUNTER
   Anima los números de estadísticas desde 0 hasta el valor
   objetivo cuando la sección entra en el viewport.
================================================================ */
const StatsModule = (() => {

  // Función easing para la animación del contador
  function easeOutQuad(t) {
    return t * (2 - t);
  }

  // Anima un elemento numérico desde 0 hasta target en duration ms
  function animateCount(el, target, duration = 1800) {
    const start = performance.now();
    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(easeOutQuad(progress) * target);
      el.textContent = value;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Observer que activa el conteo al hacer visible la tarjeta
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target.querySelector('.stat-number');
        const target = parseInt(el?.dataset.target || '0', 10);
        if (el) animateCount(el, target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  // Inicialización
  function init() {
    document.querySelectorAll('.stat-card').forEach(card => {
      observer.observe(card);
    });
  }

  return { init };
})();


/* ================================================================
   7. MÓDULO: PROJECTS SLIDESHOW
   Cada tarjeta de proyecto tiene un array de imágenes en
   data-images. Este módulo:
   - Genera los puntos (dots) indicadores
   - Cicla las imágenes automáticamente cada N ms
   - Al hacer hover pausa el ciclo
================================================================ */
const ProjectsModule = (() => {

  // Configura el slideshow de una tarjeta individual
  function setupCard(card) {
    const imgEl     = card.querySelector('.project-img');
    const dotsEl    = card.querySelector('.project-dots');
    let   images    = [];

    // Parsear el array de imágenes desde el atributo data
    try {
      images = JSON.parse(card.dataset.images || '[]');
    } catch (e) {
      console.warn('[Projects] Error parseando data-images:', e);
      return;
    }

    if (images.length <= 1 || !imgEl || !dotsEl) return;

    let current  = 0;
    let interval = null;

    // Crear dots indicadores dinámicamente
    images.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.classList.add('project-dot');
      if (i === 0) dot.classList.add('active');
      // Al hacer clic en un dot, ir a esa imagen
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    });

    // Navegar a la imagen en el índice dado
    function goTo(index) {
      const dots = dotsEl.querySelectorAll('.project-dot');
      // Transición: desvanecer y reaparecer
      imgEl.style.opacity = '0';
      setTimeout(() => {
        imgEl.src = images[index];
        imgEl.style.opacity = '1';
      }, 180);
      // Actualizar dot activo
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
      current = index;
    }

    // Avanzar a la siguiente imagen
    function next() {
      goTo((current + 1) % images.length);
    }

    // Iniciar ciclo automático
    function startInterval() {
      interval = setInterval(next, CONFIG.projectSlideshowInterval);
    }

    // Detener ciclo (al hacer hover)
    function stopInterval() {
      clearInterval(interval);
    }

    // Pausar en hover para que el usuario pueda ver la imagen
    card.addEventListener('mouseenter', stopInterval);
    card.addEventListener('mouseleave', startInterval);

    // Iniciar
    startInterval();
  }

  // Inicialización
  function init() {
    document.querySelectorAll('.project-card').forEach(card => {
      setupCard(card);
    });
  }

  return { init };
})();


/* ================================================================
   8. MÓDULO: CONTACT FORM
   Validación del lado del cliente y simulación de envío.
   Muestra errores por campo y un mensaje de éxito global.
================================================================ */
const ContactFormModule = (() => {

  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');

  // Reglas de validación por nombre de campo
  const RULES = {
    name:    { min: 2,  message: 'El nombre debe tener al menos 2 caracteres.' },
    email:   { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Ingresa un correo válido.' },
    subject: { min: 3,  message: 'El asunto debe tener al menos 3 caracteres.' },
    message: { min: 10, message: 'El mensaje debe tener al menos 10 caracteres.' },
  };

  // Valida un campo y muestra/oculta el error
  // Retorna true si es válido
  function validateField(input) {
    const rule = RULES[input.name];
    if (!rule) return true;

    const val   = input.value.trim();
    let   valid = true;
    let   msg   = '';

    if (!val) {
      valid = false;
      msg   = 'Este campo es obligatorio.';
    } else if (rule.min && val.length < rule.min) {
      valid = false;
      msg   = rule.message;
    } else if (rule.regex && !rule.regex.test(val)) {
      valid = false;
      msg   = rule.message;
    }

    // Mostrar/ocultar error visual
    const errorEl = input.parentElement?.querySelector('.form-error');
    if (errorEl) errorEl.textContent = valid ? '' : msg;
    input.classList.toggle('error', !valid);

    return valid;
  }

  // Simula el envío (reemplazar con fetch real cuando haya backend)
  function simulateSend() {
    return new Promise(resolve => setTimeout(resolve, 1800));
  }

  // Inicialización
  function init() {
    if (!form) return;

    // Validación en tiempo real al salir de cada campo
    form.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) validateField(input);
      });
    });

    // Envío del formulario
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validar todos los campos antes de enviar
      const inputs = [...form.querySelectorAll('input, textarea')];
      const allValid = inputs.every(validateField);
      if (!allValid) return;

      // Estado de carga
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn?.classList.add('loading');
      submitBtn && (submitBtn.disabled = true);

      try {
        await simulateSend();
        // Mostrar mensaje de éxito
        if (success) {
          success.hidden = false;
          success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        form.reset();
      } catch (err) {
        console.error('[ContactForm] Error al enviar:', err);
      } finally {
        submitBtn?.classList.remove('loading');
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  return { init };
})();


/* ================================================================
   9. MÓDULO: FOOTER
   Inserta el año actual dinámicamente en el footer.
================================================================ */
const FooterModule = (() => {
  function init() {
    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }
  return { init };
})();

/* ================================================================
   10. MÓDULO: LANG TOGGLE — Google Translate proxy URL
   Estrategia definitiva: redirige la página a través del proxy
   de traducción de Google (translate.google.com/translate).
   Es el método más confiable porque Google sirve la página
   completamente traducida desde sus servidores.
   - ES → EN : redirige al proxy de Google con tl=en
   - EN → ES : vuelve a la URL original sin el proxy
================================================================ */
const LangModule = (() => {

  const optionES = document.getElementById('lang-es');
  const optionEN = document.getElementById('lang-en');
  const btn      = document.getElementById('lang-toggle');

  /* ── Detecta si la página está siendo servida por el proxy de GT ──
     Cuando GT traduce via proxy, la URL contiene translate.google.com
     o el parámetro _x_tr_sl en la URL                               */
  function isOnGoogleProxy() {
    const host = window.location.hostname;
    const href = window.location.href;
    return (
      host.includes('translate.google') ||
      host.includes('translate.goog')   ||
      href.includes('_x_tr_sl=')        ||
      href.includes('translate.googleusercontent')
    );
  }

  /* ── Obtiene la URL original sin el proxy de Google ── */
  function getOriginalUrl() {
    const params = new URLSearchParams(window.location.search);
    /* Formato antiguo del proxy: parámetro "u" */
    const uParam = params.get('u');
    if (uParam) return decodeURIComponent(uParam);
    /* Formato nuevo del proxy: la URL original está en el hostname */
    /* ej: https://thefreshcompany-com.translate.goog/... */
    const host = window.location.hostname;
    if (host.includes('.translate.goog')) {
      const originalHost = host.replace('.translate.goog', '').replace(/-/g, '.');
      return `https://${originalHost}${window.location.pathname}`;
    }
    return window.location.href;
  }

  /* ── Actualiza el aspecto del botón ES | EN ── */
  function updateButton(lang) {
    if (optionES) optionES.classList.toggle('active', lang === 'es');
    if (optionEN) optionEN.classList.toggle('active', lang === 'en');
  }

  /* ── Redirige al proxy de Google para traducir ── */
  function translateTo(lang) {
    if (lang === 'en') {
      /* Construir URL del proxy de Google Translate */
      const pageUrl = encodeURIComponent(window.location.href);
      const proxyUrl = `https://translate.google.com/translate?sl=es&tl=en&hl=en&u=${pageUrl}`;
      window.location.href = proxyUrl;
    } else {
      /* Volver al idioma original */
      if (isOnGoogleProxy()) {
        window.location.href = getOriginalUrl();
      } else {
        /* Ya estamos en la página original, solo actualizar botón */
        updateButton('es');
      }
    }
  }

  /* ── Inicialización ── */
  function init() {
    /* Detectar idioma actual según si estamos en el proxy o no */
    const currentLang = isOnGoogleProxy() ? 'en' : 'es';
    updateButton(currentLang);

    /* Click en el botón */
    btn?.addEventListener('click', () => {
      const current = isOnGoogleProxy() ? 'en' : 'es';
      translateTo(current === 'es' ? 'en' : 'es');
    });
  }

  return { init };
})();

/* ================================================================
   11. INIT — Inicialización global
   Se ejecuta cuando el DOM está completamente cargado.
   Cada módulo se inicializa en orden de dependencia.
================================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // 1. Tema primero (evita flash de color incorrecto)
  ThemeModule.init();

  // 2. Navbar (scroll + hamburger + links activos)
  NavbarModule.init();

  // 3. Robot guía (posición + mensajes)
  RobotModule.init();

  // 4. Reveal on scroll + detección de sección activa
  RevealModule.init();

  // 5. Contadores animados de estadísticas
  StatsModule.init();

  // 6. Slideshow de imágenes en proyectos
  ProjectsModule.init();

  // 7. Formulario de contacto con validación
  ContactFormModule.init();

  // 8. Footer con año dinámico
  FooterModule.init();

  // 9 . Toggle de idioma con Google Translate
  LangModule.init();

  console.log('%c🤖 The Fresh Company — Sistema iniciado correctamente.', 'color:#00ffcc;font-weight:bold;');
});

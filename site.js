const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formValue = (formData, name) => String(formData.get(name) || '').trim();

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('[data-header]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  const mobileCta = document.querySelector('.mobile-cta');
  const mobileHeroQuery = window.matchMedia('(max-width: 720px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let ticking = false;

  const syncHeader = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 10);
  };

  const syncMobileHeroCta = () => {
    if (!hero || !mobileCta) return;
    const heroBottom = hero.getBoundingClientRect().bottom;
    document.body.classList.toggle(
      'hero-mobile-cta',
      mobileHeroQuery.matches && heroBottom > window.innerHeight * 0.42,
    );
  };

  const syncHero = () => {
    syncHeader();
    syncMobileHeroCta();
    if (!hero || reduceMotion.matches) return;

    const progress = clamp(window.scrollY / (window.innerHeight * 0.82), 0, 1);
    const eased = 1 - (1 - progress) ** 3;
    const homeReveal = clamp(
      (window.scrollY - window.innerHeight * 0.26) /
        (window.innerHeight * 0.52),
      0,
      1,
    );
    const homeRevealEase = 1 - (1 - homeReveal) ** 3;
    const homeSheen = Math.sin(homeRevealEase * Math.PI);

    root.style.setProperty('--hero-scale', (1 + eased * 0.09).toFixed(3));
    root.style.setProperty('--hero-shift', `${Math.round(eased * -42)}px`);
    root.style.setProperty('--hero-content-y', `${Math.round(eased * -54)}px`);
    root.style.setProperty(
      '--hero-content-opacity',
      String(clamp(1 - progress * 1.45, 0, 1).toFixed(3)),
    );
    root.style.setProperty(
      '--hero-veil',
      String(clamp(progress * 1.22, 0, 1).toFixed(3)),
    );
    root.style.setProperty(
      '--home-reveal-y',
      `${Math.round((1 - homeRevealEase) * 26)}px`,
    );
    root.style.setProperty(
      '--home-copy-y',
      `${Math.round((1 - homeRevealEase) * 16)}px`,
    );
    root.style.setProperty(
      '--home-reveal-opacity',
      String((0.88 + homeRevealEase * 0.12).toFixed(3)),
    );
    root.style.setProperty(
      '--home-sheen-opacity',
      String(clamp(homeSheen * 0.9, 0, 0.9).toFixed(3)),
    );
    root.style.setProperty(
      '--home-sheen-x',
      `${Math.round(-130 + homeRevealEase * 260)}%`,
    );
  };

  const requestSync = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      syncHero();
      ticking = false;
    });
  };

  syncHero();
  window.addEventListener('scroll', requestSync, { passive: true });
  window.addEventListener('resize', requestSync);

  navToggle?.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    header?.classList.toggle('is-open', !isOpen);
    document.body.classList.toggle('nav-open', !isOpen);
  });

  nav?.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      navToggle?.setAttribute('aria-expanded', 'false');
      header?.classList.remove('is-open');
      document.body.classList.remove('nav-open');
    }
  });

  const modals = document.querySelectorAll('[data-modal]');

  const closeModal = (modal) => {
    if (modal instanceof HTMLDialogElement && modal.open) modal.close();
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  };

  const openModal = (modalId) => {
    const modal = modalId ? document.getElementById(modalId) : null;
    if (!modal) return;
    modals.forEach(closeModal);
    modal.hidden = false;
    if (
      modal instanceof HTMLDialogElement &&
      !modal.open &&
      typeof modal.showModal === 'function'
    ) {
      modal.showModal();
    }
    document.body.classList.add('modal-open');
    modal
      .querySelector(
        '.booking-form input, .booking-form textarea, .modal-close',
      )
      ?.focus();
  };

  document.querySelectorAll('[data-modal-open]').forEach((trigger) => {
    trigger.addEventListener('click', () =>
      openModal(trigger.dataset.modalOpen),
    );
  });

  modals.forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.hasAttribute('data-modal-close')
      ) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      modals.forEach((modal) => {
        if (!modal.hidden) closeModal(modal);
      });
    }
  });

  document.querySelectorAll('[data-booking-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const formData = new FormData(form);
      const message = [
        'Ciao Ristorante Scandelin, vorrei prenotare un tavolo.',
        `Nome: ${formValue(formData, 'name')}`,
        `Telefono: ${formValue(formData, 'phone')}`,
        `Data: ${formValue(formData, 'date')}`,
        `Orario: ${formValue(formData, 'time')}`,
        `Persone: ${formValue(formData, 'people')}`,
        `Note: ${formValue(formData, 'notes') || '-'}`,
      ].join('\n');
      window.open(
        `https://wa.me/${form.dataset.whatsappNumber || '393488507347'}?text=${encodeURIComponent(message)}`,
        '_blank',
        'noopener',
      );
      const modal = form.closest('[data-modal]');
      if (modal) closeModal(modal);
      form.reset();
    });
  });

  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const viewport = carousel.querySelector('[data-carousel-viewport]');
    const track = carousel.querySelector('[data-carousel-track]');
    const prevButton = carousel.querySelector('[data-carousel-prev]');
    const nextButton = carousel.querySelector('[data-carousel-next]');
    const slides = Array.from(
      carousel.querySelectorAll('[data-carousel-card]'),
    );
    let activeIndex = 0;

    const activeSlides = () =>
      slides.filter(
        (slide) => window.getComputedStyle(slide).display !== 'none',
      );
    const visibleSlides = () =>
      window.matchMedia('(max-width: 720px)').matches
        ? Number(carousel.dataset.visibleMobile || 1)
        : Number(carousel.dataset.visibleDesktop || 3);
    const slideWidth = () => {
      const currentSlides = activeSlides();
      if (!currentSlides[0] || !viewport) return 0;
      const style = window.getComputedStyle(track || viewport);
      const gap = Number.parseFloat(style.columnGap || style.gap || '0');
      return currentSlides[0].getBoundingClientRect().width + gap;
    };
    const maxIndex = () => Math.max(activeSlides().length - visibleSlides(), 0);
    const normalizeIndex = (index) => {
      const limit = maxIndex();
      if (index < 0) return limit;
      if (index > limit) return 0;
      return index;
    };
    const goTo = (index) => {
      if (!viewport || activeSlides().length === 0) return;
      activeIndex = normalizeIndex(index);
      viewport.scrollTo({
        left: slideWidth() * activeIndex,
        behavior: 'smooth',
      });
    };

    prevButton?.addEventListener('click', () => goTo(activeIndex - 1));
    nextButton?.addEventListener('click', () => goTo(activeIndex + 1));
    viewport?.addEventListener(
      'scroll',
      () => {
        const width = slideWidth();
        if (viewport && width)
          activeIndex = clamp(
            Math.round(viewport.scrollLeft / width),
            0,
            maxIndex(),
          );
      },
      { passive: true },
    );
    window.addEventListener('resize', () => goTo(activeIndex));
  });
});

const splash = document.querySelector('#splash');
const progress = document.querySelector('#scrollProgress');
const topButton = document.querySelector('#topButton');
const reviewLink = document.querySelector('.header-review');
const nav = document.querySelector('#categoryNav');
const navLinks = [...nav.querySelectorAll('a')];
const pages = [...document.querySelectorAll('.menu-page')];

const hideSplash = () => splash?.classList.add('hidden');
window.addEventListener('load', () => window.setTimeout(hideSplash, 420), { once: true });
window.setTimeout(hideSplash, 2200);

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0}%`;
  topButton.classList.toggle('visible', window.scrollY > window.innerHeight * .75);
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScroll(); ticking = false; });
}, { passive: true });
onScroll();

topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

reviewLink?.addEventListener('click', event => {
  event.preventDefault();
  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

nav.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link) return;
  event.preventDefault();
  document.getElementById(link.dataset.page)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

const observer = new IntersectionObserver(entries => {
  const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const currentPage = Number(visible.target.id.slice(-2));
  const targetPage = currentPage === 7 ? 'menu-06' : currentPage === 9 ? 'menu-08' : visible.target.id;
  navLinks.forEach(link => link.classList.toggle('active', link.dataset.page === targetPage));
  const active = nav.querySelector('.active');
  active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}, { rootMargin: '-25% 0px -55% 0px', threshold: [0, .1, .25, .5] });

pages.forEach(page => observer.observe(page));

let scrollLockY = 0;

function lockPageScroll() {
  if (document.body.classList.contains('menu-scroll-lock')) return;
  scrollLockY = window.scrollY;
  document.body.classList.add('menu-scroll-lock');
  document.body.style.top = `-${scrollLockY}px`;
}

function unlockPageScroll() {
  if (!document.body.classList.contains('menu-scroll-lock')) return;
  document.body.classList.remove('menu-scroll-lock');
  document.body.style.top = '';
  window.scrollTo(0, scrollLockY);
}

function initMenuPinchZoom() {
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 5;
  const zoomStates = new Map();

  const dist = (a, b) => Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  const mid = touches => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  const resetPage = page => {
    const state = zoomStates.get(page);
    if (!state) return;
    state.zoom = 1;
    state.img.style.width = '';
    state.img.style.maxWidth = '';
    page.classList.remove('is-zoomed');
    state.viewport.classList.remove('can-pan', 'is-pinching');
    state.viewport.scrollLeft = 0;
    state.viewport.scrollTop = 0;
    if (![...zoomStates.values()].some(item => item.zoom > 1.02)) unlockPageScroll();
  };

  const resetOtherPages = current => {
    pages.forEach(page => {
      if (page !== current) resetPage(page);
    });
  };

  const ensureFullRes = state => {
    if (state.img.dataset.hiRes === '1') return;
    state.picture.querySelector('source')?.remove();
    if (state.fullSrc) state.img.src = state.fullSrc;
    state.img.dataset.hiRes = '1';
  };

  const setZoom = (state, nextZoom, focalX, focalY) => {
    const { viewport, img, page } = state;

    if (nextZoom <= 1.02) {
      resetPage(page);
      return;
    }

    resetOtherPages(page);
    ensureFullRes(state);

    const rect = viewport.getBoundingClientRect();
    const localX = focalX - rect.left;
    const localY = focalY - rect.top;
    const contentX = viewport.scrollLeft + localX;
    const contentY = viewport.scrollTop + localY;
    const prevZoom = state.zoom;

    state.zoom = nextZoom;
    img.style.width = `${nextZoom * 100}%`;
    img.style.maxWidth = 'none';
    viewport.classList.add('can-pan');
    page.classList.add('is-zoomed');
    lockPageScroll();

    const ratio = prevZoom > 1.02 ? nextZoom / prevZoom : nextZoom;
    viewport.scrollLeft = Math.max(0, contentX * ratio - localX);
    viewport.scrollTop = Math.max(0, contentY * ratio - localY);
  };

  pages.forEach(page => {
    const picture = page.querySelector('picture');
    const img = picture?.querySelector('img');
    if (!picture || !img) return;

    const viewport = document.createElement('div');
    viewport.className = 'menu-page__zoom';
    page.insertBefore(viewport, picture);
    viewport.appendChild(picture);

    const state = {
      page,
      picture,
      img,
      viewport,
      fullSrc: img.getAttribute('src'),
      zoom: 1,
      pinching: false,
      pinchStartDist: 0,
      pinchStartZoom: 1,
      lastTap: 0,
      hadMultiTouch: false,
      raf: 0,
      pending: null,
    };
    zoomStates.set(page, state);

    const flushZoom = () => {
      state.raf = 0;
      if (!state.pending) return;
      const { zoom, x, y } = state.pending;
      state.pending = null;
      setZoom(state, zoom, x, y);
    };

    const queueZoom = (nextZoom, focalX, focalY) => {
      state.pending = { zoom: nextZoom, x: focalX, y: focalY };
      if (!state.raf) state.raf = requestAnimationFrame(flushZoom);
    };

    viewport.addEventListener('touchstart', event => {
      if (event.touches.length === 2) {
        state.hadMultiTouch = true;
        state.pinching = true;
        viewport.classList.add('is-pinching');
        ensureFullRes(state);
        state.pinchStartDist = dist(event.touches[0], event.touches[1]);
        state.pinchStartZoom = state.zoom;
        lockPageScroll();
        event.preventDefault();
        event.stopPropagation();
      }
    }, { passive: false });

    viewport.addEventListener('touchmove', event => {
      if (!state.pinching || event.touches.length < 2) return;
      event.preventDefault();
      event.stopPropagation();

      const center = mid(event.touches);
      const nextZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, state.pinchStartZoom * (dist(event.touches[0], event.touches[1]) / state.pinchStartDist))
      );
      queueZoom(nextZoom, center.x, center.y);
    }, { passive: false });

    viewport.addEventListener('touchend', event => {
      if (event.touches.length < 2) {
        state.pinching = false;
        viewport.classList.remove('is-pinching');
      }

      if (event.touches.length === 0 && state.hadMultiTouch) {
        state.hadMultiTouch = false;
        if (state.zoom <= 1.02) resetPage(page);
        else if (state.zoom > 1.02) lockPageScroll();
        return;
      }

      const now = Date.now();
      if (
        event.changedTouches.length === 1
        && event.touches.length === 0
        && now - state.lastTap < 300
        && !state.hadMultiTouch
      ) {
        const touch = event.changedTouches[0];
        if (state.zoom > 1.02) resetPage(page);
        else setZoom(state, 2.5, touch.clientX, touch.clientY);
        state.lastTap = 0;
        event.preventDefault();
        return;
      }
      state.lastTap = now;
    }, { passive: false });

    viewport.addEventListener('touchcancel', () => {
      state.pinching = false;
      state.hadMultiTouch = false;
      viewport.classList.remove('is-pinching');
      if (state.zoom <= 1.02) resetPage(page);
    }, { passive: true });
  });
}

initMenuPinchZoom();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

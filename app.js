const splash = document.querySelector('#splash');
const progress = document.querySelector('#scrollProgress');
const topButton = document.querySelector('#topButton');
const reviewLink = document.querySelector('.header-review');
const nav = document.querySelector('#categoryNav');
const navLinks = [...nav.querySelectorAll('a')];
const pages = [...document.querySelectorAll('.menu-page')];

const SPLASH_MIN_MS = 480;
const SPLASH_MAX_MS = 45000;

function collectMenuAssetUrls() {
  const urls = new Set(['assets/brand/miqqo-logo.png']);

  document.querySelectorAll('.menu-page picture').forEach(picture => {
    const img = picture.querySelector('img');
    const source = picture.querySelector('source');
    if (img?.getAttribute('src')) urls.add(img.getAttribute('src'));
    if (source?.getAttribute('srcset')) urls.add(source.getAttribute('srcset'));
  });

  return [...urls];
}

function preloadImage(src) {
  return new Promise(resolve => {
    const image = new Image();
    image.decoding = 'async';
    const finish = () => resolve(src);
    image.onload = finish;
    image.onerror = finish;
    image.src = src;
  });
}

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

async function initSplash() {
  document.body.classList.add('is-loading');

  const urls = collectMenuAssetUrls();
  const preloadAll = Promise.all(urls.map(preloadImage));

  await Promise.race([
    Promise.all([preloadAll, wait(SPLASH_MIN_MS)]),
    wait(SPLASH_MAX_MS),
  ]);

  document.querySelectorAll('.menu-page img').forEach(img => {
    img.loading = 'eager';
    if (!img.complete) img.decode?.().catch(() => {});
  });

  splash?.classList.add('hidden');
  splash?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-loading');
}

initSplash();

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
  window.resetMenuZoom?.();
  document.getElementById(link.dataset.page)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

let blockNavSync = false;

const observer = new IntersectionObserver(entries => {
  if (blockNavSync) return;
  const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const currentPage = Number(visible.target.id.slice(-2));
  const targetPage = currentPage === 7 ? 'menu-06' : currentPage === 9 ? 'menu-08' : visible.target.id;
  navLinks.forEach(link => link.classList.toggle('active', link.dataset.page === targetPage));
  const active = nav.querySelector('.active');
  active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}, { rootMargin: '-25% 0px -55% 0px', threshold: [0, .1, .25, .5] });

pages.forEach(page => observer.observe(page));

let pinching = false;

document.addEventListener('touchmove', event => {
  if (pinching && event.touches.length >= 2) event.preventDefault();
}, { passive: false });

function initMenuPinchZoom() {
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 5;
  const IDLE_RESET_MS = 2000;
  const LEAVE_RATIO = 0.38;
  const zoomStates = new Map();
  let idleResetTimer = null;

  const dist = (a, b) => Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  const mid = touches => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  const anyZoomed = () => [...zoomStates.values()].some(item => item.zoom > 1.02);

  const syncNavBlock = () => {
    blockNavSync = pinching || anyZoomed();
  };

  const clearIdleReset = () => {
    if (!idleResetTimer) return;
    clearTimeout(idleResetTimer);
    idleResetTimer = null;
  };

  const scheduleIdleReset = () => {
    clearIdleReset();
    if (!anyZoomed()) return;
    idleResetTimer = window.setTimeout(() => {
      idleResetTimer = null;
      if (pinching) {
        scheduleIdleReset();
        return;
      }
      resetAllZoom();
    }, IDLE_RESET_MS);
  };

  const noteZoomActivity = () => {
    if (anyZoomed()) scheduleIdleReset();
    else clearIdleReset();
  };

  const unlockPageHeight = state => {
    state.page.style.minHeight = '';
    state.viewport.style.height = '';
    state.baseHeight = null;
  };

  const lockPageHeight = state => {
    if (state.baseHeight) return;
    state.baseHeight = state.page.offsetHeight;
    state.page.style.minHeight = `${state.baseHeight}px`;
    state.viewport.style.height = `${state.baseHeight}px`;
  };

  const resetPage = page => {
    const state = zoomStates.get(page);
    if (!state) return;
    state.zoom = 1;
    state.pinchAnchor = null;
    state.img.style.width = '';
    state.img.style.maxWidth = '';
    unlockPageHeight(state);
    page.classList.remove('is-zoomed');
    state.viewport.classList.remove('can-pan', 'is-pinching');
    state.viewport.scrollLeft = 0;
    state.viewport.scrollTop = 0;
    syncNavBlock();
    if (!anyZoomed()) clearIdleReset();
  };

  const resetAllZoom = () => {
    pages.forEach(page => {
      const state = zoomStates.get(page);
      if (state?.zoom > 1.02) resetPage(page);
    });
  };

  window.resetMenuZoom = resetAllZoom;

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

  const applyZoomAt = (state, nextZoom, focalX, focalY, anchor) => {
    const { viewport, img, page } = state;

    if (nextZoom <= 1.02) {
      resetPage(page);
      return;
    }

    ensureFullRes(state);
    lockPageHeight(state);
    state.zoom = nextZoom;
    img.style.width = `${nextZoom * 100}%`;
    img.style.maxWidth = 'none';
    viewport.classList.add('can-pan');
    page.classList.add('is-zoomed');

    const rect = viewport.getBoundingClientRect();
    const localX = focalX - rect.left;
    const localY = focalY - rect.top;
    const baseZoom = anchor?.startZoom ?? 1;
    const baseX = anchor?.contentX ?? localX;
    const baseY = anchor?.contentY ?? localY;
    const ratio = nextZoom / baseZoom;

    viewport.scrollLeft = Math.max(0, baseX * ratio - localX);
    viewport.scrollTop = Math.max(0, baseY * ratio - localY);
    syncNavBlock();
    noteZoomActivity();
  };

  const checkZoomedPageLeftView = () => {
    if (!anyZoomed() || pinching) return;

    zoomStates.forEach(state => {
      if (state.zoom <= 1.02) return;
      const rect = state.page.getBoundingClientRect();
      const viewTop = 0;
      const viewBottom = window.innerHeight;
      const visibleTop = Math.max(rect.top, viewTop);
      const visibleBottom = Math.min(rect.bottom, viewBottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const ratio = rect.height > 0 ? visibleHeight / rect.height : 0;

      if (ratio < LEAVE_RATIO) resetPage(state.page);
    });
  };

  window.addEventListener('scroll', () => {
    requestAnimationFrame(checkZoomedPageLeftView);
  }, { passive: true });

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
      pinchAnchor: null,
      baseHeight: null,
      lastTap: 0,
      hadMultiTouch: false,
    };
    zoomStates.set(page, state);

    viewport.addEventListener('touchstart', event => {
      if (state.zoom > 1.02 && event.touches.length === 1) noteZoomActivity();

      if (event.touches.length !== 2) return;

      resetOtherPages(page);
      state.hadMultiTouch = true;
      pinching = true;
      viewport.classList.add('is-pinching');
      ensureFullRes(state);

      const center = mid(event.touches);
      const rect = viewport.getBoundingClientRect();
      state.pinchAnchor = {
        startZoom: state.zoom,
        startDist: dist(event.touches[0], event.touches[1]),
        contentX: viewport.scrollLeft + (center.x - rect.left),
        contentY: viewport.scrollTop + (center.y - rect.top),
      };

      syncNavBlock();
      noteZoomActivity();
      event.preventDefault();
      event.stopPropagation();
    }, { passive: false });

    viewport.addEventListener('touchmove', event => {
      if (state.zoom > 1.02) noteZoomActivity();

      if (!pinching || event.touches.length < 2 || !state.pinchAnchor) return;

      event.preventDefault();
      event.stopPropagation();

      const center = mid(event.touches);
      const nextZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, state.pinchAnchor.startZoom * (dist(event.touches[0], event.touches[1]) / state.pinchAnchor.startDist))
      );

      applyZoomAt(state, nextZoom, center.x, center.y, state.pinchAnchor);
    }, { passive: false });

    viewport.addEventListener('scroll', () => {
      if (state.zoom > 1.02) noteZoomActivity();
    }, { passive: true });

    viewport.addEventListener('touchend', event => {
      if (event.touches.length >= 2) return;

      if (event.touches.length === 0) {
        pinching = false;
        viewport.classList.remove('is-pinching');
        state.pinchAnchor = null;

        if (state.hadMultiTouch) {
          state.hadMultiTouch = false;
          if (state.zoom <= 1.02) resetPage(page);
          else noteZoomActivity();
          return;
        }
      }

      const now = Date.now();
      if (
        event.changedTouches.length === 1
        && event.touches.length === 0
        && now - state.lastTap < 300
        && !state.hadMultiTouch
      ) {
        const touch = event.changedTouches[0];
        if (state.zoom > 1.02) {
          resetPage(page);
        } else {
          resetOtherPages(page);
          const rect = viewport.getBoundingClientRect();
          const anchor = {
            startZoom: 1,
            contentX: touch.clientX - rect.left,
            contentY: touch.clientY - rect.top,
          };
          applyZoomAt(state, 2.5, touch.clientX, touch.clientY, anchor);
        }
        state.lastTap = 0;
        event.preventDefault();
        return;
      }
      state.lastTap = now;
    }, { passive: false });

    viewport.addEventListener('touchcancel', () => {
      pinching = false;
      state.hadMultiTouch = false;
      state.pinchAnchor = null;
      viewport.classList.remove('is-pinching');
      if (state.zoom <= 1.02) resetPage(page);
      else noteZoomActivity();
    }, { passive: true });
  });
}

initMenuPinchZoom();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

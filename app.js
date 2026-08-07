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
  const zoomStates = new Map();

  const dist = (a, b) => Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  const mid = touches => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  const anyZoomed = () => [...zoomStates.values()].some(item => item.zoom > 1.02);

  const syncNavBlock = () => {
    blockNavSync = pinching || anyZoomed();
  };

  const resetPage = page => {
    const state = zoomStates.get(page);
    if (!state) return;
    state.zoom = 1;
    state.pinchAnchor = null;
    state.img.style.width = '';
    state.img.style.maxWidth = '';
    page.classList.remove('is-zoomed');
    state.viewport.classList.remove('can-pan', 'is-pinching');
    state.viewport.scrollLeft = 0;
    state.viewport.scrollTop = 0;
    syncNavBlock();
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

  const applyZoomAt = (state, nextZoom, focalX, focalY, anchor) => {
    const { viewport, img, page } = state;

    if (nextZoom <= 1.02) {
      resetPage(page);
      return;
    }

    ensureFullRes(state);
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
      pinchAnchor: null,
      lastTap: 0,
      hadMultiTouch: false,
    };
    zoomStates.set(page, state);

    viewport.addEventListener('touchstart', event => {
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
      event.preventDefault();
      event.stopPropagation();
    }, { passive: false });

    viewport.addEventListener('touchmove', event => {
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

    viewport.addEventListener('touchend', event => {
      if (event.touches.length >= 2) return;

      if (event.touches.length === 0) {
        pinching = false;
        viewport.classList.remove('is-pinching');
        state.pinchAnchor = null;

        if (state.hadMultiTouch) {
          state.hadMultiTouch = false;
          if (state.zoom <= 1.02) resetPage(page);
          else syncNavBlock();
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
      else syncNavBlock();
    }, { passive: true });
  });
}

initMenuPinchZoom();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

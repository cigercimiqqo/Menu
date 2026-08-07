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

function initMenuPinchZoom() {
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 5;

  pages.forEach(page => {
    const picture = page.querySelector('picture');
    const img = picture?.querySelector('img');
    if (!picture || !img) return;

    const viewport = document.createElement('div');
    viewport.className = 'menu-page__zoom';
    page.insertBefore(viewport, picture);
    viewport.appendChild(picture);

    const fullSrc = img.getAttribute('src');
    let zoom = 1;
    let pinching = false;
    let pinchStartDist = 0;
    let pinchStartZoom = 1;
    let lastTap = 0;
    let hadMultiTouch = false;

    const ensureFullRes = () => {
      if (img.dataset.hiRes === '1') return;
      picture.querySelector('source')?.remove();
      if (fullSrc) img.src = fullSrc;
      img.dataset.hiRes = '1';
    };

    const applyZoom = () => {
      if (zoom <= 1.02) {
        zoom = 1;
        img.style.width = '';
        img.style.maxWidth = '';
        page.classList.remove('is-zoomed');
        viewport.classList.remove('can-pan');
        return;
      }

      ensureFullRes();
      img.style.width = `${zoom * 100}%`;
      img.style.maxWidth = 'none';
      page.classList.add('is-zoomed');
      viewport.classList.add('can-pan');
    };

    const dist = (a, b) => Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);

    viewport.addEventListener('touchstart', event => {
      if (event.touches.length === 2) {
        hadMultiTouch = true;
        pinching = true;
        ensureFullRes();
        pinchStartDist = dist(event.touches[0], event.touches[1]);
        pinchStartZoom = zoom;
        event.preventDefault();
        return;
      }
    }, { passive: false });

    viewport.addEventListener('touchmove', event => {
      if (pinching && event.touches.length >= 2) {
        event.preventDefault();
        zoom = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, pinchStartZoom * (dist(event.touches[0], event.touches[1]) / pinchStartDist))
        );
        applyZoom();
      }
    }, { passive: false });

    viewport.addEventListener('touchend', event => {
      if (event.touches.length < 2) pinching = false;

      if (event.touches.length === 0 && hadMultiTouch) {
        hadMultiTouch = false;
        applyZoom();
        return;
      }

      const now = Date.now();
      if (
        event.changedTouches.length === 1
        && event.touches.length === 0
        && now - lastTap < 300
        && !hadMultiTouch
      ) {
        zoom = zoom > 1.02 ? 1 : 2.5;
        applyZoom();
        lastTap = 0;
        return;
      }
      lastTap = now;
    }, { passive: true });

    viewport.addEventListener('touchcancel', () => {
      pinching = false;
      hadMultiTouch = false;
    }, { passive: true });
  });
}

initMenuPinchZoom();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

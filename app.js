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
  const MIN_SCALE = 1;
  const MAX_SCALE = 4;

  pages.forEach(page => {
    const picture = page.querySelector('picture');
    if (!picture) return;

    const viewport = document.createElement('div');
    viewport.className = 'menu-page__zoom';
    const stage = document.createElement('div');
    stage.className = 'menu-page__stage';
    page.insertBefore(viewport, picture);
    viewport.appendChild(stage);
    stage.appendChild(picture);

    let scale = 1;
    let pointX = 0;
    let pointY = 0;
    let pinching = false;
    let panning = false;
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let panStartX = 0;
    let panStartY = 0;
    let panOriginX = 0;
    let panOriginY = 0;
    let lastTap = 0;
    let hadMultiTouch = false;

    const setTransform = () => {
      stage.style.transform = `translate3d(${pointX}px, ${pointY}px, 0) scale(${scale})`;
      page.classList.toggle('is-zoomed', scale > 1.02);
    };

    const resetZoom = () => {
      scale = 1;
      pointX = 0;
      pointY = 0;
      setTransform();
    };

    const dist = (a, b) => Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);

    const clampPosition = () => {
      const bounds = viewport.getBoundingClientRect();
      const stageHeight = stage.offsetHeight;
      const scaledWidth = bounds.width * scale;
      const scaledHeight = stageHeight * scale;
      const maxX = Math.max(0, (scaledWidth - bounds.width) / 2);
      const maxY = Math.max(0, (scaledHeight - bounds.height) / 2);
      pointX = Math.min(maxX, Math.max(-maxX, pointX));
      pointY = Math.min(maxY, Math.max(-maxY, pointY));
    };

    viewport.addEventListener('touchstart', event => {
      if (event.touches.length === 2) {
        hadMultiTouch = true;
        pinching = true;
        panning = false;
        pinchStartDist = dist(event.touches[0], event.touches[1]);
        pinchStartScale = scale;
        event.preventDefault();
        return;
      }

      if (event.touches.length === 1 && scale > 1.02) {
        panning = true;
        panStartX = event.touches[0].clientX;
        panStartY = event.touches[0].clientY;
        panOriginX = pointX;
        panOriginY = pointY;
      }
    }, { passive: false });

    viewport.addEventListener('touchmove', event => {
      if (pinching && event.touches.length >= 2) {
        event.preventDefault();
        const nextScale = pinchStartScale * (dist(event.touches[0], event.touches[1]) / pinchStartDist);
        scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
        if (scale <= 1.02) {
          resetZoom();
          return;
        }
        clampPosition();
        setTransform();
        return;
      }

      if (panning && event.touches.length === 1 && scale > 1.02) {
        event.preventDefault();
        pointX = panOriginX + (event.touches[0].clientX - panStartX);
        pointY = panOriginY + (event.touches[0].clientY - panStartY);
        clampPosition();
        setTransform();
      }
    }, { passive: false });

    viewport.addEventListener('touchend', event => {
      if (event.touches.length < 2) pinching = false;
      if (event.touches.length === 0) {
        panning = false;
        if (hadMultiTouch) {
          hadMultiTouch = false;
          if (scale < 1.05) resetZoom();
          return;
        }
      }
      if (scale < 1.05) resetZoom();

      const now = Date.now();
      if (
        event.changedTouches.length === 1
        && event.touches.length === 0
        && now - lastTap < 280
        && !hadMultiTouch
      ) {
        if (scale > 1.02) resetZoom();
        else {
          scale = 2.5;
          clampPosition();
          setTransform();
        }
        lastTap = 0;
        return;
      }
      lastTap = now;
    }, { passive: true });

    viewport.addEventListener('touchcancel', () => {
      pinching = false;
      panning = false;
      if (scale < 1.05) resetZoom();
    }, { passive: true });
  });
}

initMenuPinchZoom();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

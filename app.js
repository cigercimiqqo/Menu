const splash = document.querySelector('#splash');
const progress = document.querySelector('#scrollProgress');
const topButton = document.querySelector('#topButton');
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

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

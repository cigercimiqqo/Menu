/** Google İşletme Profili → Yorum iste linkleri */
const GOOGLE_REVIEW_URLS = {
  cigerci: 'https://g.page/r/CUhhZ-gt1i-wEBM/review',
  corbaci: '',
};

document.addEventListener('DOMContentLoaded', () => {
  Object.entries(GOOGLE_REVIEW_URLS).forEach(([key, url]) => {
    if (!url) console.warn(`[google-review] ${key} için GOOGLE_REVIEW_URLS boş.`);
  });

  const section = document.querySelector('.google-review');
  if (!section || !('IntersectionObserver' in window)) return;

  const reveal = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      section.classList.add('google-review--visible');
      reveal.disconnect();
    }
  }, { threshold: 0.12 });

  reveal.observe(section);
});

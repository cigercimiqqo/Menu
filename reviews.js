/** Ciğerci Miqqo — Google Business Profile place ID */
const REVIEW_PLACES = {
  cigerci: {
    placeId: 'ChIJn2IDMBo30xQRSGFn6C3WL7A',
    gPage: 'https://g.page/r/CUhhZ-gt1i-wEBM/review',
  },
  corbaci: {
    placeId: '',
    gPage: '',
  },
};

function buildReviewHref(placeId) {
  const mobile = `https://search.google.com/local/writereview/mobile?placeid=${encodeURIComponent(placeId)}`;
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isIOS ? mobile.replace(/^https:\/\//i, 'comgooglemapsurl://') : mobile;
}

document.addEventListener('DOMContentLoaded', () => {
  const cigerciBtn = document.querySelector('.google-review__btn[href]');
  const { placeId } = REVIEW_PLACES.cigerci;

  if (cigerciBtn && placeId) {
    cigerciBtn.href = buildReviewHref(placeId);
  } else if (!placeId) {
    console.warn('[google-review] Ciğerci Miqqo placeId boş.');
  }

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

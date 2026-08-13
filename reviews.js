/**
 * Google Business Profile → Yorum iste
 * g.page linki resmi kaynak; iOS'ta Maps yorum ekranını açmaz, Safari'de form açılır.
 */
const REVIEW_LINKS = {
  cigerci: {
    gPage: 'https://g.page/r/CUhhZ-gt1i-wEBM/review',
    placeId: 'ChIJn2IDMBo30xQRSGFn6C3WL7A',
  },
  corbaci: {
    gPage: '',
    placeId: '',
  },
};

function buildWriteReviewUrl(placeId) {
  const id = encodeURIComponent(placeId);
  return `https://search.google.com/local/writereview?placeid=${id}&source=g.page.m.ia._&laa=nmx-review-solicitation-ia2`;
}

function buildReviewHref({ gPage, placeId }) {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  if (isIOS && placeId) {
    return buildWriteReviewUrl(placeId);
  }

  if (isAndroid && placeId) {
    const fallback = encodeURIComponent(gPage || buildWriteReviewUrl(placeId));
    const id = encodeURIComponent(placeId);
    return `intent://search.google.com/local/writereview/mobile?placeid=${id}#Intent;scheme=https;package=com.google.android.apps.maps;S.browser_fallback_url=${fallback};end`;
  }

  return gPage || (placeId ? buildWriteReviewUrl(placeId) : '#');
}

document.addEventListener('DOMContentLoaded', () => {
  const cigerciBtn = document.querySelector('.google-review__btn[href]');
  const link = REVIEW_LINKS.cigerci;

  if (cigerciBtn && (link.gPage || link.placeId)) {
    cigerciBtn.href = buildReviewHref(link);

    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      cigerciBtn.target = '_blank';
      cigerciBtn.rel = 'noopener noreferrer';
    }
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

const REVIEW_BUSINESSES = [
  {
    id: 'cigerci',
    logo: 'assets/brand/miqqo-logo.png',
    logoAlt: 'Ciğerci Miqqo',
    reviewUrl: 'https://g.page/r/CUhhZ-gt1i-wEBM/review',
    rating: null,
    reviewCount: null,
  },
  {
    id: 'corbaci',
    logo: 'assets/brand/corbaci-mark.png',
    logoAlt: 'Çorbacı Miqqo',
    reviewUrl: '',
    rating: null,
    reviewCount: null,
  },
];

const REVIEWS = {
  open(business) {
    const url = business.reviewUrl;
    if (!url) return;

    if (business.reviewUrl.startsWith('https://g.page/')) {
      window.location.assign(business.reviewUrl);
      return;
    }

    const placeId = encodeURIComponent(business.placeId || '');
    const web = `https://search.google.com/local/writereview?placeid=${placeId}`;
    const mobile = `https://search.google.com/local/writereview/mobile?placeid=${placeId}`;
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    if (isAndroid) {
      const fallback = encodeURIComponent(web);
      window.location.href = `intent://search.google.com/local/writereview/mobile?placeid=${placeId}#Intent;scheme=https;package=com.google.android.apps.maps;S.browser_fallback_url=${fallback};end`;
      return;
    }

    if (isIOS) {
      window.location.assign(mobile);
      window.setTimeout(() => { window.location.assign(web); }, 1400);
      return;
    }

    window.open(web, '_blank', 'noopener,noreferrer');
  },

  render(container) {
    if (!container) return;

    container.innerHTML = REVIEW_BUSINESSES.map(business => {
      const active = Boolean(business.reviewUrl);
      const stats = business.rating != null
        ? `<div class="review-tile__stats" aria-label="${formatRating(business.rating)} puan${business.reviewCount != null ? `, ${formatCount(business.reviewCount)} değerlendirme` : ''}">
            <span class="review-tile__score">${formatRating(business.rating)}</span>
            <span class="review-tile__stars">${renderStars(business.rating)}</span>
            ${business.reviewCount != null ? `<span class="review-tile__count">${formatCount(business.reviewCount)}</span>` : ''}
          </div>`
        : '';

      if (!active) {
        return `<article class="review-tile review-tile--idle" aria-label="${business.logoAlt}">
          <div class="review-tile__frame">
            <div class="review-tile__logo${business.id === 'corbaci' ? ' review-tile__logo--corbaci' : ''}"><img src="${business.logo}" alt="${business.logoAlt}" loading="lazy" decoding="async"></div>
          </div>
        </article>`;
      }

      return `<button class="review-tile review-tile--live" type="button" data-review-id="${business.id}" aria-label="${business.logoAlt} — Google'da değerlendir">
        <span class="review-tile__shine" aria-hidden="true"></span>
        <span class="review-tile__frame">
          <span class="review-tile__logo${business.id === 'corbaci' ? ' review-tile__logo--corbaci' : ''}"><img src="${business.logo}" alt="${business.logoAlt}" loading="lazy" decoding="async"></span>
          ${stats}
          <span class="review-tile__action">
            ${googleMark()}
            <span class="review-tile__action-text">Değerlendir</span>
            <span class="review-tile__action-star" aria-hidden="true">★</span>
          </span>
        </span>
      </button>`;
    }).join('');

    container.querySelectorAll('[data-review-id]').forEach(button => {
      button.addEventListener('click', () => {
        const business = REVIEW_BUSINESSES.find(item => item.id === button.dataset.reviewId);
        if (business) REVIEWS.open(business);
      });
    });
  },
};

function formatRating(value) {
  return Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatCount(value) {
  return Number(value).toLocaleString('tr-TR');
}

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, index) => {
    const fill = Math.min(1, Math.max(0, rating - index));
    return `<span class="star" style="--fill:${fill}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.87 5.82 6.42.93-4.64 4.53 1.1 6.4L12 17.9l-5.75 3.02 1.1-6.4L2.71 9.25l6.42-.93L12 2.5z"/></svg></span>`;
  }).join('');
}

function googleMark() {
  return `<svg class="review-tile__g" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`;
}

document.addEventListener('DOMContentLoaded', () => {
  REVIEWS.render(document.querySelector('#reviewsGrid'));
});

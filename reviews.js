/**
 * İşletme ayarları — Google Business Profile → "Yorum iste" linkini yapıştırın.
 * g.page/r/…/review formatı en güvenilir yöntemdir; uygulamayı doğrudan açar.
 */
const REVIEW_BUSINESSES = [
  {
    id: 'cigerci',
    name: 'Ciğerci Miqqo',
    subtitle: 'Kebap · Pide · Ciğer',
    reviewUrl: '', // örn: https://g.page/r/XXXX/review
    placeId: '',   // alternatif: ChIJ… Place ID
    rating: null,  // örn: 4.3
    reviewCount: null, // örn: 507
    showStats: true,
  },
  {
    id: 'corbaci',
    name: 'Çorbacı Miqqo',
    subtitle: 'Çorba · Ara Sıcak',
    reviewUrl: '',
    placeId: '',
    showStats: false,
    note: 'Yeni açıldı — ilk yorumu siz bırakın.',
  },
];

const REVIEWS = {
  open(business) {
    const url = resolveReviewUrl(business);
    if (!url) return;

    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    if (business.reviewUrl) {
      window.location.assign(business.reviewUrl);
      return;
    }

    const placeId = encodeURIComponent(business.placeId);
    const web = `https://search.google.com/local/writereview?placeid=${placeId}`;
    const mobile = `https://search.google.com/local/writereview/mobile?placeid=${placeId}`;

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
      const stats = business.showStats && business.rating != null
        ? `<div class="review-card__stats">
            <span class="review-card__score">${formatRating(business.rating)}</span>
            <span class="review-card__stars" aria-label="${formatRating(business.rating)} üzerinden 5">${renderStars(business.rating)}</span>
            ${business.reviewCount != null ? `<span class="review-card__count">${formatCount(business.reviewCount)} değerlendirme</span>` : ''}
          </div>`
        : business.note
          ? `<p class="review-card__note">${business.note}</p>`
          : '';

      const ready = Boolean(business.reviewUrl || business.placeId);

      return `<article class="review-card${business.showStats ? '' : ' review-card--new'}">
        <div class="review-card__top">
          <span class="review-card__brand" aria-hidden="true">${googleMark()}</span>
          <div class="review-card__identity">
            <h3>${business.name}</h3>
            <p>${business.subtitle}</p>
          </div>
        </div>
        ${stats}
        <button class="review-card__cta" type="button" data-review-id="${business.id}"${ready ? '' : ' disabled'}>
          Google'da değerlendir
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
        </button>
      </article>`;
    }).join('');

    container.querySelectorAll('[data-review-id]').forEach(button => {
      button.addEventListener('click', () => {
        const business = REVIEW_BUSINESSES.find(item => item.id === button.dataset.reviewId);
        if (business) REVIEWS.open(business);
      });
    });
  },
};

function resolveReviewUrl(business) {
  if (business.reviewUrl) return business.reviewUrl;
  if (business.placeId) return `https://search.google.com/local/writereview?placeid=${business.placeId}`;
  return null;
}

function formatRating(value) {
  return Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatCount(value) {
  return Number(value).toLocaleString('tr-TR');
}

function renderStars(rating) {
  const stars = [];
  for (let i = 1; i <= 5; i += 1) {
    const fill = Math.min(1, Math.max(0, rating - (i - 1)));
    stars.push(`<span class="star" style="--fill:${fill}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.87 5.82 6.42.93-4.64 4.53 1.1 6.4L12 17.9l-5.75 3.02 1.1-6.4L2.71 9.25l6.42-.93L12 2.5z"/></svg></span>`);
  }
  return stars.join('');
}

function googleMark() {
  return `<svg viewBox="0 0 24 24" role="img" aria-label="Google"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`;
}

document.addEventListener('DOMContentLoaded', () => {
  REVIEWS.render(document.querySelector('#reviewsGrid'));
});

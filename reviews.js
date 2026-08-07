const REVIEW_PLACES = {
  cigerci: {
    placeId: 'ChIJn2IDMBo30xQRSGFn6C3WL7A',
    gPageReview: 'https://g.page/r/CUhhZ-gt1i-wEBM/review',
  },
  corbaci: {
    placeId: '',
    gPageReview: '',
  },
};

function writeReviewUrls(placeId) {
  const id = encodeURIComponent(placeId);
  return {
    mobile: `https://search.google.com/local/writereview/mobile?placeid=${id}`,
    web: `https://search.google.com/local/writereview?placeid=${id}`,
  };
}

function toGoogleMapsAppUrl(httpsUrl) {
  return httpsUrl.replace(/^https:\/\//i, 'comgooglemapsurl://');
}

function openReview(key) {
  const place = REVIEW_PLACES[key];
  if (!place) return;

  const { placeId, gPageReview } = place;
  if (!placeId && !gPageReview) return;

  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const urls = placeId ? writeReviewUrls(placeId) : null;

  if (isIOS) {
    // Safari https:// açar — comgooglemapsurl:// Maps uygulamasına yönlendirir
    const appTargets = [
      urls?.mobile && toGoogleMapsAppUrl(urls.mobile),
      gPageReview && toGoogleMapsAppUrl(gPageReview),
      urls?.web && toGoogleMapsAppUrl(urls.web),
      placeId && `comgooglemaps://?q=place_id:${encodeURIComponent(placeId)}`,
    ].filter(Boolean);

    window.location.assign(appTargets[0]);
    return;
  }

  if (isAndroid) {
    const web = urls?.web || gPageReview;
    const mobile = urls?.mobile || gPageReview;
    const fallback = encodeURIComponent(web);
    const target = mobile.includes('search.google.com')
      ? mobile
      : `https://search.google.com/local/writereview/mobile?placeid=${encodeURIComponent(placeId)}`;

    window.location.assign(
      `intent://${target.replace(/^https:\/\//, '')}#Intent;scheme=https;package=com.google.android.apps.maps;S.browser_fallback_url=${fallback};end`,
    );
    return;
  }

  window.open(gPageReview || urls?.web, '_blank', 'noopener,noreferrer');
}

function initReviewCta() {
  document.querySelectorAll('[data-review-link]').forEach(button => {
    button.addEventListener('click', () => {
      openReview(button.dataset.reviewLink);
    });
  });

  const section = document.querySelector('.review-cta');
  if (!section || !('IntersectionObserver' in window)) {
    section?.classList.add('review-cta--visible');
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        section.classList.add('review-cta--visible');
        observer.disconnect();
      }
    });
  }, { threshold: 0.15 });

  observer.observe(section);
}

document.addEventListener('DOMContentLoaded', initReviewCta);

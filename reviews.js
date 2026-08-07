const REVIEW_LINKS = {
  cigerci: 'https://g.page/r/CUhhZ-gt1i-wEBM/review',
  corbaci: '',
};

function openReview(url) {
  if (!url) return;
  const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (mobile) window.location.assign(url);
  else window.open(url, '_blank', 'noopener,noreferrer');
}

function initReviewCta() {
  document.querySelectorAll('[data-review-link]').forEach(button => {
    button.addEventListener('click', () => {
      openReview(REVIEW_LINKS[button.dataset.reviewLink]);
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

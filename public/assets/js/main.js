document.addEventListener("DOMContentLoaded", () => {
  const backToTop = document.querySelector(".back-to-top");

  const toggleBackToTop = () => {
    if (!backToTop) return;
    backToTop.classList.toggle("is-visible", window.scrollY > 200);
  };

  window.addEventListener("scroll", toggleBackToTop, { passive: true });
  toggleBackToTop();
});

document.addEventListener("DOMContentLoaded", () => {
  const toggles = document.querySelectorAll(".js-faq-toggle");

  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq__item");
      item.classList.toggle("is-open");
    });
  });
});

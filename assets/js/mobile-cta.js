// =============================================================================
// Canopy — плавающая кнопка «Записаться» на телефоне
// Показывается, когда первый экран прокручен, и прячется, когда видна форма.
// Внешний вид задан в home.css (.mobile-cta).
// =============================================================================

(function () {
  'use strict';

  var cta = document.getElementById('mobile-cta');
  var hero = document.querySelector('.hero');
  var lead = document.getElementById('lead');
  if (!cta || !hero || !lead) return;

  function update() {
    var pastHero = window.scrollY > hero.offsetTop + hero.offsetHeight - 80;
    var formVisible = lead.getBoundingClientRect().top < window.innerHeight * 0.6;
    cta.classList.toggle('show', pastHero && !formVisible);
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

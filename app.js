// Плавающая кнопка на телефоне: видна после первого экрана и прячется у формы
(function () {
  var cta = document.getElementById('mobile-cta');
  var hero = document.querySelector('.hero');
  var lead = document.getElementById('lead');
  if (!cta || !hero || !lead) return;
  function onScroll() {
    var pastHero = window.scrollY > hero.offsetTop + hero.offsetHeight - 80;
    var atForm = lead.getBoundingClientRect().top < window.innerHeight * 0.6;
    cta.classList.toggle('show', pastHero && !atForm);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// Форма заявки
(function () {
  var form = document.getElementById('lead-form');
  if (!form) return;
  var openedAt = Date.now();

  // Сейчас демо: ничего не отправляем.
  // При подключении здесь будет запрос к серверу в России. Сервер обязан сам
  // повторить все проверки ниже: проверку в браузере легко обойти.
  function sendLead(data) {
    return new Promise(function (resolve) { setTimeout(resolve, 600); });
  }

  function check(name, ok) {
    form.querySelector('[data-field="' + name + '"]').classList.toggle('invalid', !ok);
    return ok;
  }
  function validate() {
    var f = form.elements;
    var contact = f.contact.value.trim();
    var isTg = /^@?[A-Za-z0-9_]{5,32}$/.test(contact) && /[A-Za-z]/.test(contact);
    var isPhone = contact.replace(/\D/g, '').length >= 10 && contact.length <= 30;
    return [
      check('name', f.name.value.trim().length >= 2 && f.name.value.length <= 100),
      check('contact', isTg || isPhone),
      check('business', f.business.value !== ''),
      check('consent', f.consent.checked)
    ].every(Boolean);
  }

  // Похоже на бота: заполнено скрытое поле или форму отправили быстрее чем за 3 секунды
  function looksLikeBot() {
    return form.elements.company.value !== '' || Date.now() - openedAt < 3000;
  }

  function showSuccess() {
    form.classList.add('sent');
  }

  function recheck(e) {
    var wrap = e.target.closest('[data-field]');
    if (wrap && wrap.classList.contains('invalid')) validate();
  }
  form.addEventListener('input', recheck);
  form.addEventListener('change', recheck);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      var first = form.querySelector('.invalid input, .invalid select');
      if (first) first.focus();
      return;
    }
    // Боту показываем обычное «спасибо», чтобы он не пробовал снова, но ничего не отправляем
    if (looksLikeBot()) { showSuccess(); return; }

    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Отправляем…';
    var data = Object.fromEntries(new FormData(form));
    delete data.company;
    data.consent_at = new Date().toISOString(); // когда дано согласие: пригодится как доказательство
    data.page = location.href;
    sendLead(data).then(showSuccess);
  });
})();

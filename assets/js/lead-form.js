// =============================================================================
// Canopy — форма заявки на бесплатный разбор
// =============================================================================

// -----------------------------------------------------------------------------
// Настройка
// -----------------------------------------------------------------------------

// Адрес сервера, который принимает заявки.
// Пока он пустой, форма работает в демо-режиме: проверяет поля, показывает
// «Спасибо» и ничего не отправляет. Подписи с атрибутом data-demo-only видны
// только в демо-режиме и исчезают сами, когда адрес заполнен.
// Сервер должен быть в России (см. CHECKLIST.md, раздел «Приём заявок»).
// После заполнения добавьте этот адрес в connect-src в index.html.
var LEAD_ENDPOINT = '';

// Если форму отправили быстрее, скорее всего, это бот
var MIN_FILL_TIME_MS = 3000;

// -----------------------------------------------------------------------------

(function () {
  'use strict';

  var form = document.getElementById('lead-form');
  if (!form) return;

  var demoMode = LEAD_ENDPOINT === '';
  var openedAt = Date.now();
  var submitBtn = form.querySelector('button[type=submit]');
  var submitText = submitBtn.textContent;
  var errorBox = form.querySelector('.form-error');

  if (!demoMode) {
    document.querySelectorAll('[data-demo-only]').forEach(function (el) { el.remove(); });
  }

  // --- Проверка полей --------------------------------------------------------
  // Это только подсказка для человека. Сервер обязан повторить все проверки:
  // обойти проверку в браузере нетрудно.

  function mark(name, ok) {
    form.querySelector('[data-field="' + name + '"]').classList.toggle('invalid', !ok);
    return ok;
  }

  function isTelegram(value) {
    return /^@?[A-Za-z0-9_]{5,32}$/.test(value) && /[A-Za-z]/.test(value);
  }

  function isPhone(value) {
    return value.replace(/\D/g, '').length >= 10 && value.length <= 30;
  }

  function validate() {
    var f = form.elements;
    var name = f.name.value.trim();
    var contact = f.contact.value.trim();
    return [
      mark('name', name.length >= 2 && name.length <= 100),
      mark('contact', isTelegram(contact) || isPhone(contact)),
      mark('business', f.business.value !== ''),
      mark('consent', f.consent.checked)
    ].every(Boolean);
  }

  // После первой неудачной попытки подсказки обновляются по мере ввода
  function recheck(event) {
    var field = event.target.closest('[data-field]');
    if (field && field.classList.contains('invalid')) validate();
  }

  // --- Защита от ботов -------------------------------------------------------

  function looksLikeBot() {
    var trapFilled = form.elements.company.value !== '';
    var tooFast = Date.now() - openedAt < MIN_FILL_TIME_MS;
    return trapFilled || tooFast;
  }

  // --- Отправка --------------------------------------------------------------

  function collect() {
    var data = Object.fromEntries(new FormData(form));
    delete data.company;
    data.consent_at = new Date().toISOString(); // когда дано согласие: доказательство для проверок
    data.page = location.href;
    return data;
  }

  function send(data) {
    if (demoMode) {
      return new Promise(function (resolve) { setTimeout(resolve, 600); });
    }
    return fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
    });
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? 'Отправляем…' : submitText;
  }

  function showSuccess() {
    form.classList.add('sent');
  }

  function showError() {
    setBusy(false);
    errorBox.classList.add('show');
  }

  form.addEventListener('input', recheck);
  form.addEventListener('change', recheck);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    errorBox.classList.remove('show');

    if (!validate()) {
      var first = form.querySelector('.invalid input, .invalid select');
      if (first) first.focus();
      return;
    }

    // Боту показываем обычное «спасибо», чтобы он не пробовал снова, но ничего не отправляем
    if (looksLikeBot()) {
      showSuccess();
      return;
    }

    setBusy(true);
    send(collect()).then(showSuccess, showError);
  });
})();

/*
 * Bridge Finance landing page — interactive behaviour.
 *
 * Extracted from the inline <script> in index.html so the logic can be
 * unit-tested. This file works two ways:
 *   • In the browser it attaches the modal handlers to the global scope so the
 *     inline on* attributes (onclick="openModal(...)") keep working, and wires
 *     up the overlay + stats observer on load.
 *   • Under CommonJS (Vitest) it exports the same functions for direct testing
 *     and does NOT auto-initialise, so tests control the DOM and timing.
 */
(function (global) {
  'use strict';

  /* ── MODAL ── */
  var _enquiryType = '';

  function getEnquiryType() { return _enquiryType; }

  function hideAllSteps() {
    ['modal-step-1', 'modal-step-2', 'modal-step-3', 'modal-step-pr'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  function showStep(n) {
    hideAllSteps();
    var el = document.getElementById('modal-step-' + n);
    if (el) el.style.display = 'block';
  }

  function openModal(type) {
    document.getElementById('modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    if (type === 'property-review') {
      showStep('pr');
    } else {
      showStep(1);
    }
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.body.style.overflow = '';
  }

  function nextStep(type) {
    _enquiryType = type;
    var label = document.getElementById('modal-type-label');
    if (label) label.textContent = type;
    showStep(2);
  }

  function submitEnquiry() {
    var name  = document.getElementById('modal-name').value.trim();
    var phone = document.getElementById('modal-phone').value.trim();
    var email = document.getElementById('modal-email').value.trim();
    var msg   = document.getElementById('modal-message').value.trim();
    if (!name || !phone) { window.alert('Please fill in your name and phone number.'); return; }
    var subject = encodeURIComponent('Bridge Finance Enquiry — ' + _enquiryType);
    var body = encodeURIComponent(
      'Hi William,\n\nEnquiry Type: ' + _enquiryType + '\n\n' +
      'Name: ' + name + '\nPhone: ' + phone + '\nEmail: ' + (email || 'Not provided') +
      '\n\nSituation:\n' + (msg || 'Not provided') + '\n\n---\nSent via bridge-finance landing page'
    );
    window.open('mailto:williamzhu@bridge-finance.com.au?subject=' + subject + '&body=' + body, '_blank');
    showStep(3);
  }

  function submitPropertyReview() {
    var addresses = document.getElementById('pr-addresses').value.trim();
    var name      = document.getElementById('pr-name').value.trim();
    var phone     = document.getElementById('pr-phone').value.trim();
    if (!addresses || !name || !phone) { window.alert('Please fill in all required fields.'); return; }
    var subject = encodeURIComponent('Free Property Analysis Request — ' + name);
    var body = encodeURIComponent(
      'Hi William,\n\n' + name + ' would like a free property analysis.\n\n' +
      'Properties to analyse:\n' + addresses + '\n\nPhone: ' + phone +
      '\n\n---\nSent via bridge-finance landing page'
    );
    window.open('mailto:williamzhu@bridge-finance.com.au?subject=' + subject + '&body=' + body, '_blank');
    showStep(3);
  }

  function initModalOverlay() {
    var overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    overlay.addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });
  }

  /* ── STATS COUNTER ANIMATION ── */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function animateCount(id, start, end, duration, fmt) {
    var el = document.getElementById(id);
    if (!el) return;
    var startTime = null;
    function step(now) {
      if (!startTime) startTime = now;
      var progress = Math.min((now - startTime) / duration, 1);
      var value = Math.round(easeOut(progress) * (end - start) + start);
      el.textContent = fmt(value);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function runStatsAnimation() {
    animateCount('stat-loans',   0, 500, 1800, function (v) { return '$' + v + 'M+'; });
    animateCount('stat-lenders', 0, 90,  1500, function (v) { return v + '+'; });
    animateCount('stat-cba',     1, 50,  1600, function (v) { return 'Top ' + v; });
    /* Stars: animate in one by one */
    var si = 0;
    var starEl = document.getElementById('stat-stars');
    if (starEl) {
      starEl.textContent = '';
      var starTimer = setInterval(function () {
        si++;
        starEl.textContent = '★'.repeat(si);
        if (si >= 5) clearInterval(starTimer);
      }, 260);
    }
  }

  /*
   * Returns an IntersectionObserver callback that fires `onIntersect` exactly
   * once, the first time the target becomes visible. Factored out so the
   * fire-once guard can be unit-tested without a real IntersectionObserver.
   */
  function createStatsObserverCallback(onIntersect) {
    var animated = false;
    return function (entries) {
      if (entries[0].isIntersecting && !animated) {
        animated = true;
        onIntersect();
      }
    };
  }

  function initStatsObserver() {
    var statsSection = document.getElementById('stats-section');
    if (!statsSection || typeof IntersectionObserver === 'undefined') return;
    var statsObserver = new IntersectionObserver(
      createStatsObserverCallback(runStatsAnimation),
      { threshold: 0.4 }
    );
    statsObserver.observe(statsSection);
  }

  function init() {
    initModalOverlay();
    initStatsObserver();
  }

  var api = {
    getEnquiryType: getEnquiryType,
    hideAllSteps: hideAllSteps,
    showStep: showStep,
    openModal: openModal,
    closeModal: closeModal,
    nextStep: nextStep,
    submitEnquiry: submitEnquiry,
    submitPropertyReview: submitPropertyReview,
    easeOut: easeOut,
    animateCount: animateCount,
    runStatsAnimation: runStatsAnimation,
    createStatsObserverCallback: createStatsObserverCallback,
    initModalOverlay: initModalOverlay,
    initStatsObserver: initStatsObserver,
    init: init
  };

  /* Expose the functions referenced by inline on* attributes on the global. */
  ['openModal', 'closeModal', 'nextStep', 'submitEnquiry', 'submitPropertyReview']
    .forEach(function (name) { global[name] = api[name]; });

  if (typeof module !== 'undefined' && module.exports) {
    /* CommonJS (tests): export the API, do not auto-initialise. */
    module.exports = api;
  } else if (typeof document !== 'undefined') {
    /* Browser: initialise once the DOM is ready. */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

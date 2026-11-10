/* AMS shared visual theme selector.
   Important: this file must not create, move, hide or replace any app elements.
   It only adds two attributes to <body> so the shared stylesheet can theme
   the existing DOM while preserving every app's original layout and behavior.
*/
(function () {
  'use strict';

  var path = window.location.pathname || '';
  if (/\/juegos\/ams-fly(?:\/|$)/i.test(path)) return;

  var app = /\/ayukcal(?:\/|$)/i.test(path) ? 'ayukcal' :
            /\/herramientas(?:\/|$)/i.test(path) ? 'herramientas' :
            /\/juegos(?:\/|$)/i.test(path) ? 'juegos' : '';

  if (!app || !document.body) return;

  document.body.classList.add('ams-shared');
  document.body.setAttribute('data-ams-app', app);
})();

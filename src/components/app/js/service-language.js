'use strict';

(function closure(window) {
  var defaultLanguage = 'en';
  var userLanguage = navigator.language || navigator.userLanguage;
  var availableLanguages = [defaultLanguage];
  if (availableLanguages.indexOf(userLanguage) === -1) {
    userLanguage = defaultLanguage;
  }

  window.angular.module('app').constant('lang', {
    current: userLanguage,
    default: defaultLanguage,
    available: availableLanguages
  });
})(window);

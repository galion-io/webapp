'use strict';

(function closure(window) {
  var module = window.angular.module('app', [
    'templates',
    'ui.router',
    'ngSanitize',
    'ngAnimate',
    'pascalprecht.translate',
    'ngProgress',
    'api',
    'auth',
    'header',
    'menu',
    'dashboard',
    'portfolios',
    'accounts'
  ]);

  module.config([
    '$stateProvider',
    '$translateProvider',
    '$urlRouterProvider',
    'lang',
    function config($stateProvider, $translateProvider, $urlRouterProvider, lang) {
      // i18n setup
      $translateProvider.fallbackLanguage(lang.default);
      $translateProvider.preferredLanguage(lang.current);
      $translateProvider.useSanitizeValueStrategy('escape');
      $translateProvider.useStaticFilesLoader({
        prefix: 'i18n/',
        suffix: '.json'
      });

      // default route definition
      var defaultRoute = 'dashboard';
      var sessionValidUntil = window.localStorage.getItem('session-valid-until') || 0;
      if (sessionValidUntil < Date.now()) {
        defaultRoute = 'login';
      }
      $urlRouterProvider.when('', '/' + defaultRoute);
      $urlRouterProvider.when('/', '/' + defaultRoute);
      $urlRouterProvider.otherwise('/' + defaultRoute);

      $stateProvider.state('app', {
        url: '',
        abstract: true,
        templateUrl: 'app/templates/app.html',
        controller: 'AppCtrl'
      });
    }
  ]);
})(window);

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
    '$httpProvider',
    'lang',
    function config($stateProvider, $translateProvider, $urlRouterProvider, $httpProvider, lang) {
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
        defaultRoute = 'auth/login';
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

      // progress bars
      $httpProvider.interceptors.push(['$timeout', function($timeout) {
        var ngProgressFactory = window.angular.injector(['ng', 'ngProgress']).get('ngProgressFactory');
        var progressbar = ngProgressFactory.createInstance();
        progressbar.setColor('#e35f9b');
        progressbar.setHeight('5px');

        var pool = {};
        var timeoutEnd = null;
        return {
          request: onRequest,
          requestError: onRequest,
          response: onResponse,
          responseError: onResponse
        };

        function onRequest(req) {
          if (!timeoutEnd && Object.keys(pool).length === 0) {
            progressbar.start();
          }
          pool[req.method + ' ' + req.url] = Date.now();
          return req;
        }

        function onResponse(response) {
          delete pool[response.config.method + ' ' + response.config.url];
          if (Object.keys(pool).length === 0) {
            if (timeoutEnd) {
              $timeout.cancel(timeoutEnd);
            }
            timeoutEnd = $timeout(function() {
              if (Object.keys(pool).length === 0) {
                progressbar.complete();
              }
              timeoutEnd = null;
            }, 100);
          }
          return response;
        }
      }]);
    }
  ]);
})(window);

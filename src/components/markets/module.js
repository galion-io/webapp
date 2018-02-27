'use strict';

(function closure(window) {
  var module = window.angular.module('markets', [
    'ui.router',
    'templates',
    'pascalprecht.translate',
    'api'
  ]);

  module.config([
    '$stateProvider',
    function config($stateProvider) {
      $stateProvider.state('app.markets', {
        url: '/markets',
        views: {
          'header': {
            controller: 'HeaderCtrl',
            templateUrl: 'header/templates/header.html'
          },
          'menu': {
            controller: 'MenuCtrl',
            templateUrl: 'menu/templates/menu.html'
          },
          'maincontent': {
            controller: 'MarketsCtrl',
            templateUrl: 'markets/templates/markets.html',
          }
        }
      });
    }
  ]);
})(window);

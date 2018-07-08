'use strict';

(function closure(window) {
  var module = window.angular.module('exchange', [
    'ui.router',
    'templates',
    'pascalprecht.translate',
    'ui.select',
    'api'
  ]);

  module.config([
    '$stateProvider',
    function config($stateProvider) {
      $stateProvider.state('app.exchange', {
        url: '/exchange',
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
            controller: 'ExchangeCtrl',
            templateUrl: 'exchange/templates/exchange.html',
          }
        }
      });
    }
  ]);
})(window);

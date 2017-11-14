'use strict';

(function closure(window) {
  var module = window.angular.module('portfolios', [
    'ui.router',
    'templates',
    'pascalprecht.translate',
    'ui.select',
    'api'
  ]);

  module.config([
    '$stateProvider',
    function config($stateProvider) {
      $stateProvider.state('app.portfolios', {
        url: '/portfolios',
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
            controller: 'PortfoliosCtrl',
            templateUrl: 'portfolios/templates/portfolios.html',
          }
        }
      });
    }
  ]);
})(window);

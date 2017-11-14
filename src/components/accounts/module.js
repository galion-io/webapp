'use strict';

(function closure(window) {
  var module = window.angular.module('accounts', [
    'ui.router',
    'templates',
    'pascalprecht.translate',
    'ui.select',
    'api'
  ]);

  module.config([
    '$stateProvider',
    function config($stateProvider) {
      $stateProvider.state('app.accounts', {
        url: '/accounts',
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
            controller: 'AccountsCtrl',
            templateUrl: 'accounts/templates/accounts.html',
          }
        }
      });
    }
  ]);
})(window);

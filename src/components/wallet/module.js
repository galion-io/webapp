'use strict';

(function closure(window) {
  var module = window.angular.module('wallet', [
    'ui.router',
    'templates',
    'pascalprecht.translate',
    'api'
  ]);

  module.config([
    '$stateProvider',
    function config($stateProvider) {
      $stateProvider.state('app.wallet', {
        url: '/wallet',
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
            controller: 'WalletCtrl',
            templateUrl: 'wallet/templates/wallet.html',
          }
        }
      });
    }
  ]);
})(window);

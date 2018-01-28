'use strict';

(function closure(window) {
  var module = window.angular.module('ledger', [
    'ui.router',
    'templates',
    'pascalprecht.translate',
    'ui.select'
  ]);

  module.config([
    '$stateProvider',
    function config($stateProvider) {
      $stateProvider.state('ledger', {
        url: '/ledger',
        controller: 'LedgerCtrl',
        templateUrl: 'ledger/templates/ledger.html'
      });

      $stateProvider.state('ledger.eth', {
        url: '/eth',
        controller: 'LedgerEthCtrl',
        templateUrl: 'ledger/templates/eth.html'
      });

      $stateProvider.state('ledger.btc', {
        url: '/btc',
        controller: 'LedgerBtcCtrl',
        templateUrl: 'ledger/templates/btc.html'
      });
    }
  ]);
})(window);

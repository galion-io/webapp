'use strict';

(function closure(window) {
  window.angular.module('ledger').controller('LedgerBtcCtrl', [
    '$window',
    '$scope',
    '$http',
    '$timeout',
    function($window, $scope, $http, $timeout) {
      var ledger = $window.ledger;
      $scope.data = {};
      $scope.err = null;
      var path = '44\'/0\'/0\'/0';

      $scope.init = function init() {
        $scope.err = null;
        $scope.data = {};

        $scope.tryReadBitcoin();
      };

      $scope.tryReadBitcoin = function tryReadBitcoin() {
        new ledger.btc($scope.$parent.comm).getWalletPublicKey_async(path).then(function(data) {
          $scope.data = {
            currency: 'btc',
            address: data.bitcoinAddress
          };
          $scope.$apply();
        }).catch(function() {
          $timeout($scope.tryReadBitcoin, 1000);
        });
      };


      $scope.init();
    }]);
})(window);

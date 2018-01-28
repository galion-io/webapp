'use strict';

(function closure(window) {
  window.angular.module('ledger').controller('LedgerEthCtrl', [
    '$window',
    '$scope',
    '$http',
    '$timeout',
    function($window, $scope, $http, $timeout) {
      var ledger = $window.ledger;
      var ethereumjs = $window.ethereumjs;
      $scope.data = {};
      $scope.err = null;
      var path = '44\'/60\'/0\'/0';

      $scope.init = function init() {
        $scope.err = null;
        $scope.data = {};

        $scope.tryReadEther();
      };

      $scope.tryReadEther = function tryReadEther() {
        new ledger.eth($scope.$parent.comm).getAddress_async(path).then(function(data) {
          $scope.data = {
            currency: 'eth',
            address: data.address,
            publicKey: data.publicKey,
            gasPrice: '45',
            gasLimit: '21000'
          };

          $scope.$apply();

          $http({
            method: 'GET',
            url: 'https://api.etherscan.io/api?module=account&action=txlist&sort=desc&address=' + data.address,
            withCredentials: false
          }).then(function(res) {
            var lastNonce = 0;
            res.data.result.forEach(function(tx) {
              if (tx.from.toUpperCase() === data.address.toUpperCase() && Number(tx.nonce) > lastNonce) {
                lastNonce = Number(tx.nonce);
              }
            });
            $scope.data.nonce = lastNonce + 1;
          });
          $http({
            method: 'GET',
            url: 'https://api.etherscan.io/api?module=account&action=balance&tag=latest&address=' + data.address,
            withCredentials: false
          }).then(function(res) {
            $scope.data.balance = Number(res.data.result) / 1000000000000000000; // wei -> eth
          });
          $http({
            method: 'GET',
            url: 'https://ethgasstation.info/json/ethgasAPI.json',
            withCredentials: false
          }).then(function(res) {
            $scope.data.gasPrice = Math.ceil(res.data.safeLow / 10).toString();
          });
        }).catch(function() {
          $timeout($scope.tryReadEther, 1000);
        });
      };

      $scope.init();

      $scope.askSignEtherTransaction = function askSignEtherTransaction() {
        var raw = {
          nonce: '0x' + Number($scope.data.nonce).toString(16),
          gasPrice: '0x' + (Number($scope.data.gasPrice) * 1000000000).toString(16),
          gasLimit: '0x' + Number($scope.data.gasLimit).toString(16),
          to: $scope.data.to.toLowerCase(),
          value: '0x' + (Number($scope.data.txValue) * 1000000000000000000).toString(16),
          chainId: 1,
          r: '0x00',
          s: '0x00',
          v: '0x01'
        };
        var txToSign = new ethereumjs.Tx(raw).serialize().toString('hex');

        new ledger.eth($scope.$parent.comm).signTransaction_async(path, txToSign).then(function(result) {
          raw.r = '0x' + result.r;
          raw.s = '0x' + result.s;
          raw.v = '0x' + result.v;
          var txSigned = new ethereumjs.Tx(raw);
          txSigned._chainId = raw.chainId;
          txSigned._senderPubKey = $scope.data.publicKey;

          $scope.data.txRaw = raw;
          $scope.data.txSigned = '0x' + txSigned.serialize().toString('hex');

          $scope.$apply();
        }).catch(function() {});
      };
    }]);
})(window);

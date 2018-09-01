'use strict';

(function closure(window) {
  window.angular.module('ethereum').controller('SidepanelLedgerEthCtrl', [
    '$rootScope',
    '$q',
    '$window',
    '$scope',
    '$timeout',
    'sidepanel',
    'value',
    'EthereumApis',
    function($rootScope, $q, $window, $scope, $timeout, sidepanel, value, EthereumApis) {
      $scope.paths = [
        { path: 'm/44\'/60\'/0\'', label: 'Ledger (ETH)' },
        { path: 'm/44\'/60\'/0\'/0', label: 'Jaxx, Metamask, Trezor (ETH), ...' },
        { path: 'm/44\'/60\'/160720\'/0', label: 'Ledger (ETC)' },
        { path: 'm/44\'/61\'/0\'/0', label: 'Trezor (ETC)' },
        { path: 'm/44\'/1\'/0\'/0', label: 'Testnets' }
      ];
      $scope.value = value;
      var ledger = $window.ledger;
      $scope.data = {};
      $scope.err = null;
      var comm = null;

      $scope.initInterval = null;
      $scope.init = function init() {
        ledger.comm_u2f.create_async(30).then(function(_comm) {
          comm = _comm;
          $scope.checkConnection();
        }).catch(function() {
          $scope.err = {
            code: 'COMPAT-01',
            message: 'Your browser does not support U2F connections.'
          };
        });
      };
      $scope.init();

      var checkConnectionTimeout = null;
      $scope.checkConnection = function checkConnection() {
        return new ledger.eth(comm).getAddress_async($scope.paths[0].path + '/0').then(function() {
          $scope.data.connected = true;
          $scope.$apply();
        }).catch(function() {
          if (checkConnectionTimeout !== -1) {
            checkConnectionTimeout = $timeout(function() {
              $scope.checkConnection();
            }, 1000);
          }
        });
      };
      $scope.$on('sidepanel.close', function() {
        $timeout.cancel(checkConnectionTimeout);
        checkConnectionTimeout = -1;
      });

      $scope.setPath = function setPath(pathItem) {
        $scope.data.path = pathItem.path;
        $scope.readAddresses(0, 10);
      };

      var readAddressesTimeout = null;
      $scope.readAddresses = function readAddresses(from, to) {
        var arr = [];
        for (var i = from; i < to; i++) {
          arr.push(i);
        }

        $scope.data.addresses = [];
        return $q.all(arr.map(function(index) {
          return new ledger.eth(comm).getAddress_async($scope.data.path + '/' + index).then(function(data) {
            return EthereumApis.getAddressBalance(data.address).then(function(balance) {
              // prevent duplicates in the loop
              var found = false;
              for (var j = 0; j < $scope.data.addresses.length; j++) {
                if ($scope.data.addresses.length[j] && $scope.data.addresses.length[j].index === index) {
                  found = true;
                }
              }

              if (!found) {
                $scope.data.addresses.push({
                  index: index,
                  address: data.address,
                  publicKey: data.publicKey,
                  balance: balance,
                  img: $window['ethereum-blockies-base64'](data.address.toLowerCase())
                });
              }
            });
          });
        })).catch(function() {
          if (readAddressesTimeout !== -1) {
            readAddressesTimeout = $timeout(function() {
              $scope.readAddresses(from, to);
            }, 1000);
          }
        });
      };
      $scope.$on('sidepanel.close', function() {
        $timeout.cancel(readAddressesTimeout);
        readAddressesTimeout = -1;
      });

      $scope.setAddress = function setAddress(add) {
        $rootScope.$broadcast('ethaddress.set', {
          type: 'ledger',
          path: $scope.data.path + '/' + add.index,
          publickey: add.publicKey,
          address: add.address,
          balance: add.balance,
          img: add.img
        });
        sidepanel.hide();
      };

      $scope.closeSidepanel = sidepanel.hide;
    }]);
})(window);

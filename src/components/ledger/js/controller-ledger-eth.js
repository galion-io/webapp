'use strict';

(function closure(window) {
  window.angular.module('ledger').controller('LedgerEthCtrl', [
    '$q',
    'api',
    'apiUtils',
    '$window',
    '$scope',
    '$http',
    '$timeout',
    'sidepanel',
    'value',
    function($q, api, apiUtils, $window, $scope, $http, $timeout, sidepanel, value) {
      $scope.paths = [
        { path: 'm/44\'/60\'/0\'', label: 'Ledger (ETH)' },
        { path: 'm/44\'/60\'/0\'/0', label: 'Jaxx, Metamask, Exodus, Trezor (ETH), ...' },
        { path: 'm/44\'/60\'/160720\'/0', label: 'Ledger (ETC)' },
        { path: 'm/44\'/61\'/0\'/0', label: 'Trezor (ETC)' },
        { path: 'm/44\'/1\'/0\'/0', label: 'Testnets' }
      ];
      $scope.value = value;
      var ledger = $window.ledger;
      var ethereumjs = $window.ethereumjs;
      $scope.data = {};
      $scope.err = null;
      $scope.compatible = null;
      var comm = null;

      $scope.initInterval = null;
      $scope.init = function init() {
        ledger.comm_u2f.create_async(30).then(function(_comm) {
          comm = _comm;
          $scope.compatible = true;
          $scope.checkConnection();
        }).catch(function() {
          $scope.compatible = false;
        });
      };
      $scope.init();

      $scope.checkConnection = function checkConnection() {
        return new ledger.eth(comm).getAddress_async($scope.paths[0].path + '/0').then(function() {
          $scope.data.connected = true;
          $scope.$apply();
        }).catch(function() {
          $scope.checkConnection();
        });
      };

      $scope.setPath = function setPath(pathItem) {
        $scope.data.path = pathItem.path;
        $scope.readAddresses(0, 10);
      };

      $scope.readAddresses = function readAddresses(from, to) {
        var arr = [];
        for (var i = from; i < to; i++) {
          arr.push(i);
        }

        $scope.data.addresses = [];
        return $q.all(arr.map(function(index) {
          return new ledger.eth(comm).getAddress_async($scope.data.path + '/' + index).then(function(data) {
            return $http({
              method: 'GET',
              url: 'https://api.etherscan.io/api?module=account&action=balance&tag=latest&address=' + data.address,
              withCredentials: false
            }).then(function(res) {
              var balance = Number(res.data.result) / 1000000000000000000; // wei -> eth

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
          $timeout(function() {
            $scope.readAddresses(from, to);
          }, 1000);
        });
      };

      $scope.updateNonce = function updateNonce() {
        return $http({
          method: 'GET',
          url: 'https://api.etherscan.io/api?module=account&action=txlist&sort=desc&address=' + $scope.data.tx.address,
          withCredentials: false
        }).then(function(res) {
          var lastNonce = 0;
          (res.data.result || []).forEach(function(tx) {
            if (tx.from.toUpperCase() === $scope.data.tx.address.toUpperCase() && Number(tx.nonce) > lastNonce) {
              lastNonce = Number(tx.nonce);
            }
          });
          $scope.data.tx.nonce = lastNonce + 1;
        });
      };

      $scope.updateGasPrice = function updateGasPrice() {
        return $http({
          method: 'GET',
          url: 'https://ethgasstation.info/json/ethgasAPI.json',
          withCredentials: false
        }).then(function(res) {
          $scope.data.tx.gasPrice = Math.ceil(res.data.safeLow / 10).toString();
        });
      };

      $scope.setAddress = function setAddress(add) {
        $scope.data.img = add.img;
        $scope.data.tx = {
          advanced: false,
          currency: 'eth',
          address: add.address,
          publicKey: add.publicKey,
          gasPrice: '45',
          gasLimit: '21000',
          nonce: 0,
          balance: add.balance
        };

        $scope.updateNonce();
        $scope.updateGasPrice();
      };

      $scope.askSignEtherTransaction = function askSignEtherTransaction() {
        var raw = {
          nonce: '0x' + Number($scope.data.tx.nonce).toString(16),
          gasPrice: '0x' + (Number($scope.data.tx.gasPrice) * 1000000000).toString(16),
          gasLimit: '0x' + Number($scope.data.tx.gasLimit).toString(16),
          to: $scope.data.tx.to.toLowerCase(),
          value: '0x' + (Number($scope.data.tx.txValue) * 1000000000000000000).toString(16),
          chainId: 1,
          r: '0x00',
          s: '0x00',
          v: '0x01',
          data: ''
        };

        if ($scope.data.erc20) {
          var tokenContract = new $window.web3.eth.contract($scope.data.contractAbi);
          var tokenInstance = tokenContract.at($scope.data.contractAddress);
          raw.data = tokenInstance.transfer.getData(raw.to, $scope.data.nTokens * Math.pow(10, $scope.data.contractDecimals));
          raw.to = $scope.data.contractAddress;
        }

        var txToSign = new ethereumjs.Tx(raw).serialize().toString('hex');

        new ledger.eth(comm).signTransaction_async($scope.data.path, txToSign).then(function(result) {
          raw.r = '0x' + result.r;
          raw.s = '0x' + result.s;
          raw.v = '0x' + result.v;
          var txSigned = new ethereumjs.Tx(raw);
          txSigned._chainId = raw.chainId;
          txSigned._senderPubKey = $scope.data.tx.publicKey;

          $scope.data.tx.txRaw = raw;
          $scope.data.tx.txSigned = '0x' + txSigned.serialize().toString('hex');

          $scope.$apply();
        }).catch(function() {});
      };

      $scope.sendEther = function sendEther() {
        $scope.data.tx.gasLimit = 21000;
        $scope.data.tx.txValue = 0;
        $scope.data.erc20 = false;
      };

      $scope.selectPreset = function selectPreset(add, info) {
        if ($scope.data.loadingContractAbi) {
          return;
        }

        $scope.data.contractAddress = add;
        $scope.data.contractDecimals = info.decimals;
        $scope.data.nTokens = null;
      };

      $scope.$watch('data.tx.to', function(address) {
        address = address || ' ';
        $scope.data.toAddressIdenticon = $window['ethereum-blockies-base64'](address);
      });

      $scope.$watch('data.contractAddress', function(address) {
        getAbi(address);
      });

      function getAbi(address) {
        $scope.data.contractAbi = null;
        $scope.data.loadingContractAbi = true;
        return $http({
          method: 'GET',
          url: 'https://api.etherscan.io/api?module=contract&action=getabi&address=' + address,
          withCredentials: false
        }).then(function(response) {
          if (response.data.status === '1') {
            $scope.data.contractAbi = JSON.parse(response.data.result);
          } else if (response.data.status === '0') {
            $scope.data.contractAbi = -1;
          } else {
            throw 'unexpected response';
          }
        }).catch(function() {
          $scope.data.contractAbi = -2;
        }).finally(function() {
          $scope.data.loadingContractAbi = false;
        });
      }

      $scope.sendErc20 = function sendErc20() {
        $scope.data.tx.txValue = 0;
        $scope.data.tx.gasLimit = 50000;
        $scope.data.erc20 = true;
        $scope.data.contractAbi = null;

        if ($scope.data.contractAddress) {
          getAbi($scope.data.contractAddress);
        }

        var presets = {};
        return api.getMyAssets(value.getDisplayCurrency()).then(function(myAssets) {
          apiUtils.erc20byAddress(myAssets, $scope.data.tx.address).forEach(function(erc20) {
            presets[erc20.address] = erc20;
          });
        }).finally(function() {
          var defaultTokens = [
            { address: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200', symbol: 'KNC', name: 'Kyber Network', decimals: 18 },
            { address: '0x8f8221afbb33998d8584a2b05749ba73c37a938a', symbol: 'REQ', name: 'Request Network', decimals: 18 }
          ];

          defaultTokens.forEach(function(d) {
            if (!presets[d.address]) {
              presets[d.address] = { symbol: d.symbol, name: d.name, decimals: d.decimals, balance: 0 };
            }
          });

          $scope.data.presets = presets;
        });
      };

      $scope.erc20FullBalance = function erc20FullBalance() {
        var nTokens = 0;
        for (var key in $scope.data.presets) {
          if (key === $scope.data.contractAddress) {
            nTokens = $scope.data.presets[key].balance;
          }
        }
        $scope.data.nTokens = nTokens;
      };

      $scope.closeSidepanel = sidepanel.hide;
    }]);
})(window);

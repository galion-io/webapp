'use strict';

(function closure(window) {
  window.angular.module('ethereum').component('sendethform', {
    restrict: 'E',
    transclude: true,
    bindings: {
      addressdata: '<'
    },
    templateUrl: 'ethereum/templates/sendethform.html',
    controller: [
      '$q',
      'api',
      'apiUtils',
      '$window',
      'value',
      'EthereumApis',
      function($q, api, apiUtils, $window, value, EthereumApis) {
        var $ctrl = this;

        $ctrl.init = function init() {
          $ctrl.value = value;
          $ctrl.erc20 = false;
          $ctrl.advanced = false;
          $ctrl.tx = {
            from: null,
            to: null,
            value: 0,
            gasPrice: '45',
            gasLimit: '21000',
            data: null,
            nonce: 0
          };
        };
        $ctrl.init();

        $ctrl.$onChanges = function() {
          $ctrl.updatePresets();
          if ($ctrl.addressdata) {
            $ctrl.tx.nonce = $ctrl.addressdata.nonce;
          } else {
            $ctrl.tx.nonce = 0;
          }
        };

        updateGasPrice();

        $ctrl.erc20Changed = function() {
          if ($ctrl.erc20) {
            $ctrl.sendErc20();
          } else {
            $ctrl.sendEther();
          }
        };

        $ctrl.sendEther = function sendEther() {
          $ctrl.tx.gasLimit = '21000';
          $ctrl.tx.value = '0';
          $ctrl.erc20 = false;
        };

        $ctrl.sendErc20 = function sendErc20() {
          $ctrl.tx.value = '0';
          $ctrl.tx.gasLimit = '50000';
          $ctrl.erc20 = true;
          $ctrl.updateContract();
          $ctrl.updatePresets();
        };

        $ctrl.updateTo = function updateTo() {
          $ctrl.toAddressIdenticon = $window['ethereum-blockies-base64']($ctrl.tx.to || ' ');
        };
        $ctrl.updateTo();

        $ctrl.updateContract = function updateContract() {
          $ctrl.contract = null;
          $ctrl.contractDecimals = null;
          if (!$ctrl.contractAddress) {
            return;
          }

          $ctrl.loadingContract = true;
          EthereumApis.getContract($ctrl.contractAddress).then(function(contract) {
            $ctrl.contract = contract;

            return $q(function(resolve, reject) {
              contract.decimals(function(err, decimals) {
                if (err) {
                  reject(err);
                  return;
                }
                resolve(decimals.toNumber());
              });
            }).then(function(decimals) {
              $ctrl.contractDecimals = decimals;
            });
          }).catch(function() {
            $ctrl.contract = -1;
          }).finally(function() {
            $ctrl.loadingContract = false;
          });
        };

        $ctrl.updatePresets = function updatePresets() {
          var presets = {};
          var getAddressTokens = $q.resolve([]);
          if ($ctrl.addressdata && $ctrl.addressdata.address) {
            getAddressTokens = api.getMyAssets(value.getDisplayCurrency()).then(function(myAssets) {
              return apiUtils.erc20byAddress(myAssets, $ctrl.addressdata.address);
            });
          }

          return getAddressTokens.then(function(tokens) {
            tokens.forEach(function(erc20) {
              presets[erc20.address] = erc20;
            });
          }).finally(function() {
            var defaultTokens = [
              { address: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200', symbol: 'KNC', name: 'Kyber Network', decimals: 18 },
              { address: '0x8f8221afbb33998d8584a2b05749ba73c37a938a', symbol: 'REQ', name: 'Request Network', decimals: 18 }
            ];

            // add default tokens to presets if the user don't have them already
            defaultTokens.forEach(function(d) {
              if (!presets[d.address]) {
                presets[d.address] = { symbol: d.symbol, name: d.name, decimals: d.decimals, balance: 0 };
              }
            });

            $ctrl.presets = presets;
          });
        };

        $ctrl.erc20FullBalance = function erc20FullBalance() {
          var nTokens = 0;
          for (var key in $ctrl.presets) {
            if (key === $ctrl.contractAddress) {
              nTokens = $ctrl.presets[key].balance;
            }
          }
          $ctrl.tx.value = nTokens;
        };

        $ctrl.selectPreset = function selectPreset(add, info) {
          if ($ctrl.loadingContract) {
            return;
          }

          $ctrl.contractAddress = add;
          $ctrl.contractDecimals = info.decimals;
          $ctrl.value = '0';

          $ctrl.updateContract();
        };

        $ctrl.submit = function submit() {
          if (!$ctrl.addressdata) {
            return;
          }

          var tx = {
            to: $ctrl.tx.to,
            value: Number($ctrl.tx.value),
            gasPrice: Number($ctrl.tx.gasPrice),
            gasLimit: Number($ctrl.tx.gasLimit),
            nonce: $ctrl.tx.nonce
          };

          if ($ctrl.erc20) {
            tx.value = 0;
            tx.to = $ctrl.contractAddress,
            tx.data = $ctrl.contract.transfer.getData($ctrl.tx.to, $ctrl.tx.value * Math.pow(10, Number($ctrl.contractDecimals)));
          }

          $ctrl.signing = true;
          $ctrl.addressdata.promptTxSign(tx).finally(function() {
            $ctrl.signing = false;
          });
        };

        function updateGasPrice() {
          return EthereumApis.getGasPrice().then(function(gasPrice) {
            $ctrl.gasPrice = gasPrice;
            $ctrl.tx.gasPrice = gasPrice.fast.toString();
          });
        }
      }
    ]
  });
})(window);

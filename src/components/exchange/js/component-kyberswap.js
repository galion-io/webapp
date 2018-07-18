'use strict';

(function closure(window) {
  window.angular.module('exchange').component('kyberswap', {
    templateUrl: 'exchange/templates/kyberswap.html',
    bindings: {
      addressdata: '<'
    },
    controller: [
      '$rootScope',
      '$scope',
      '$q',
      '$http',
      'value',
      'sidepanel',
      'EthereumApis',
      'KyberNetwork',
      '$filter',
      function($rootScope, $scope, $q, $http, value, sidepanel, EthereumApis, KyberNetwork, $filter) {
        var $ctrl = this;
        $ctrl.value = value;
        $ctrl.minConversionRate = 97;

        function initBaseQuote() {
          $ctrl.base = {
            symbol: 'ETH',
            label: 'Ethereum',
            contractAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            decimals: 18,
            volume: 0, // how much we want to trade
            price: 0, // price per unit (in displayCurrency)
            balance: 0 // balance on selected account
          };
          $ctrl.quote = {
            symbol: 'KNC',
            label: 'Kyber Network Crystal',
            contractAddress: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
            decimals: 18,
            volume: 0,
            price: 0,
            balance: 0
          };
        }
        initBaseQuote();

        $ctrl.$onChanges = function() {
          if ($ctrl.addressdata) {
            $ctrl.refreshBalance('base');
            $ctrl.refreshBalance('quote');

            refreshIndividualCap();

            if ($ctrl.base.symbol !== 'ETH') {
              $ctrl.refreshAllowance();
            }
          }
        };

        $ctrl.init = function init() {
          $ctrl.loadingTradePairs = true;
          return $q.all([
            getEthPrice(),
            getGasPrice(),
            getKyberContractAddress()
          ]).then(function() {
            return $q.all([
              getTradePairs($ctrl.ethPrice),
              getMaxGasPrice()
            ]);
          }).then(function() {
            $ctrl.base.price = $ctrl.ethPrice;
            $ctrl.quote.price = $ctrl.tradepairs.filter(function(pair) {
              return pair.symbol === $ctrl.quote.symbol;
            })[0].price;
            $ctrl.onBaseChange();
            $ctrl.onQuoteChange();
          }).finally(function() {
            $ctrl.loadingTradePairs = false;
          });
        };
        $ctrl.init();

        $ctrl.onBaseChange = function onBaseChange() {
          if ($ctrl.base.symbol !== 'ETH' && $ctrl.addressdata) {
            $ctrl.refreshAllowance();
          }

          if (isNaN(Number($ctrl.base.volume)) || !$ctrl.base.volume) {
            $ctrl.base.volume = 0;
          }

          if ($ctrl.base.volume === '0') {
            $ctrl.quote.volume = 0;
            return;
          }
          var quoteToBase = $ctrl.base.price / $ctrl.quote.price;
          $ctrl.quote.volume = value.round($ctrl.base.volume * quoteToBase);
        };

        $ctrl.onQuoteChange = function onQuoteChange() {
          if (isNaN(Number($ctrl.quote.volume)) || !$ctrl.quote.volume) {
            $ctrl.quote.volume = 0;
          }

          if ($ctrl.quote.volume === '0') {
            $ctrl.base.volume = 0;
            return;
          }
          var baseToQuote = $ctrl.quote.price / $ctrl.base.price;
          $ctrl.base.volume = value.round($ctrl.quote.volume * baseToQuote);
        };

        $ctrl.getTradeValue = function getTradeValue() {
          return $ctrl.value.display($ctrl.base.volume * $ctrl.base.price);
        };

        $ctrl.promptChangeAsset = function promptChangeAsset(baseOrQuote) {
          var assets = $ctrl.tradepairs.map(function(pair) {
            return {
              symbol: pair.symbol,
              contractAddress: pair.contractAddress,
              decimals: pair.decimals,
              price: pair.price,
              label: pair.name
            };
          });

          assets.unshift({
            symbol: 'ETH',
            contractAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            price: $ctrl.ethPrice,
            decimals: 18,
            label: 'Ethereum'
          });

          sidepanel.show('exchange/templates/sidepanel-token-select.html', {
            baseOrQuote: baseOrQuote,
            assets: assets
          });
        };

        $ctrl.invertSwapBaseQuote = function invertSwapBaseQuote() {
          var tmp = $ctrl.base;
          $ctrl.base = $ctrl.quote;
          $ctrl.quote = tmp;
        };

        $rootScope.$on('sidepanel-token-selected', function($ev, data) {
          $ctrl[data.baseOrQuote].symbol = data.asset.symbol;
          $ctrl[data.baseOrQuote].price = data.asset.price;
          $ctrl[data.baseOrQuote].label = data.asset.label;
          $ctrl[data.baseOrQuote].contractAddress = data.asset.contractAddress;
          $ctrl[data.baseOrQuote].decimals = data.asset.decimals;
          $ctrl[data.baseOrQuote].volume = 0;
          $ctrl[data.baseOrQuote].balance = 0;

          if (data.baseOrQuote === 'base') {
            $ctrl.onQuoteChange();
          } else {
            $ctrl.onBaseChange();
          }

          if ($ctrl.addressdata) {
            $ctrl.refreshBalance(data.baseOrQuote);
          }
        });

        $ctrl.refreshAllowance = function refreshAllowance() {
          if (!$ctrl.addressdata || $ctrl.base.symbol === 'ETH') {
            return;
          }

          return EthereumApis.getContract($ctrl.base.contractAddress).then(function(contract) {
            contract.allowance($ctrl.addressdata.address, $ctrl.kyberAddress, function(err, amount) {
              if (err) {
                $ctrl.allowance = 0;
              } else {
                $ctrl.allowance = amount.toNumber() / Math.pow(10, $ctrl.base.decimals);
              }
              $scope.$apply();
            });
          });
        };

        $ctrl.refreshBalance = function refreshBalance(baseOrQuote) {
          if (!$ctrl.addressdata || !$ctrl.addressdata.address) {
            $ctrl[baseOrQuote].balance = 0;
            return;
          }

          EthereumApis.getAddressTokenBalance(
            $ctrl.addressdata.address,
            $ctrl[baseOrQuote].contractAddress,
            $ctrl[baseOrQuote].decimals
          ).then(function(balance) {
            $ctrl[baseOrQuote].balance = balance;
          });
        };

        $ctrl.swapError = function swapError() {
          if ($ctrl.base.symbol === $ctrl.quote.symbol) {
            return $filter('translate')('EXCHANGE.ERRORS.SAME_ASSET');
          } else if (Number($ctrl.base.balance) < Number($ctrl.base.volume)) {
            return $filter('translate')('EXCHANGE.ERRORS.INSUFFICIENT_FUNDS');
          } else if ($ctrl.individualCap && $ctrl.individualCap < $ctrl.base.volume * $ctrl.base.price / $ctrl.ethPrice) {
            return $filter('translate')('EXCHANGE.ERRORS.INDIVIDUAL_CAP');
          }
          return '';
        };

        $ctrl.submit = function() {
          return EthereumApis.getContract($ctrl.kyberAddress).then(function(contract) {
            var params = {
              src: $ctrl.base.contractAddress,
              srcAmount: $ctrl.base.volume * Math.pow(10, $ctrl.base.decimals),
              dest: $ctrl.quote.contractAddress,
              destAddress: $ctrl.addressdata.address,
              maxDestAmount: '0x8000000000000000000000000000000000000000000000000000000000000000',
              minConversionRate: ($ctrl.base.price / $ctrl.quote.price) * ($ctrl.minConversionRate / 100),
              walletId: 0
            };

            var data = contract.trade.getData(
              params.src,
              params.srcAmount,
              params.dest,
              params.destAddress,
              params.maxDestAmount,
              params.minConversionRate,
              params.walletId
            );

            $ctrl.addressdata.promptTxSign({
              to: $ctrl.kyberAddress,
              value: $ctrl.base.symbol === 'ETH' ? Number($ctrl.base.volume) : 0,
              data: data,
              gasPrice: Math.min($ctrl.gasPrice.fast, $ctrl.maxGasPrice),
              gasLimit: 500000
            }).then(function(txHash) {
              $ctrl.txHash = txHash;
            });
          });
        };

        $ctrl.submitAllowance = function() {
          return EthereumApis.getContract($ctrl.base.contractAddress).then(function(contract) {
            var data = contract.approve.getData($ctrl.kyberAddress, $ctrl.base.volume * Math.pow(10, $ctrl.base.decimals));

            $ctrl.addressdata.promptTxSign({
              to: $ctrl.base.contractAddress,
              value: 0,
              data: data,
              gasPrice: $ctrl.gasPrice.fast,
              gasLimit: 50000
            }).then(function(txHash) {
              $ctrl.txHash = txHash;
            });
          });
        };

        function getTradePairs() {
          return KyberNetwork.getTradePairs($ctrl.ethPrice).then(function(tradepairs) {
            $ctrl.tradepairs = tradepairs;
          }).catch(function(err) {
            $ctrl.error = err;
          });
        }

        function getEthPrice() {
          return EthereumApis.getEthPrice().then(function(price) {
            $ctrl.ethPrice = price;
          });
        }

        function getGasPrice() {
          return EthereumApis.getGasPrice().then(function(price) {
            $ctrl.gasPrice = price;
          });
        }

        function getKyberContractAddress() {
          return EthereumApis.resolveEnsName('kybernetwork.eth').then(function(address) {
            $ctrl.kyberAddress = address;
          });
        }

        function getMaxGasPrice() {
          return EthereumApis.getContract($ctrl.kyberAddress).then(function(contract) {
            contract.maxGasPrice(function(err, data) {
              $ctrl.maxGasPrice = data.toNumber() / 1e9; // in Gwei
              $scope.$apply();
            });
          });
        }

        function refreshIndividualCap() {
          return EthereumApis.getContract($ctrl.kyberAddress).then(function(contract) {
            contract.getUserCapInWei($ctrl.addressdata.address, function(err, data) {
              $ctrl.individualCap = data.toNumber() / 1e18;
              $scope.$apply();
            });
          });
        }
      }
    ]
  });
})(window);

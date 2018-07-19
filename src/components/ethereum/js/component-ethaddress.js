'use strict';

(function closure(window) {
  window.angular.module('ethereum').component('ethaddress', {
    restrict: 'E',
    transclude: true,
    bindings: {
      data: '='
    },
    templateUrl: 'ethereum/templates/ethaddress.html',
    controller: [
      '$q',
      '$window',
      '$rootScope',
      '$scope',
      'sidepanel',
      'value',
      'EthereumApis',
      '$interval',
      function($q, $window, $rootScope, $scope, sidepanel, value, EthereumApis, $interval) {
        var $ctrl = this;
        $ctrl.value = value;

        $ctrl.openLedgerSidepanel = function openLedgerSidepanel() {
          sidepanel.show('ethereum/templates/sidepanel-ledger.html');
        };

        $ctrl.connectMetamask = function connectMetamask() {
          if (!$window.web3 || !$window.web3.eth || !$window.web3.eth.accounts || !$window.web3.eth.accounts[0]) {
            $ctrl.metamaskError = 'NO_WEB3';
            return;
          }
          $window.web3.version.getNetwork(function(err, netId) {
            if (err) {
              $ctrl.metamaskError = 'UNK';
              $scope.$apply();
              return;
            }

            if (netId !== '1') {
              $ctrl.metamaskError = 'NO_MAINNET';
              $scope.$apply();
              return;
            }

            $window.web3.eth.getBalance($window.web3.eth.accounts[0], function(err, balanceBN) {
              if (err) {
                $ctrl.metamaskError = 'UNK';
                $scope.$apply();
                return;
              }

              $rootScope.$broadcast('ethaddress.set', {
                type: 'metamask',
                address: $window.web3.eth.accounts[0],
                balance: balanceBN.toNumber() / 1e18,
                img: $window['ethereum-blockies-base64']($window.web3.eth.accounts[0].toLowerCase())
              });
            });
          });
        };

        var refreshNonceInterval = $interval(function() {
          if ($ctrl && $ctrl.data && $ctrl.data.address) {
            refreshLastNonce();
          }
        }, 10000); // every 10s, refresh nonce
        $scope.$on('$destroy', function() {
          $interval.cancel(refreshNonceInterval);
        });

        function refreshLastNonce() {
          EthereumApis.getTxCount($ctrl.data.address).then(function(txCount) {
            if (!$ctrl.data.nonce || txCount >= $ctrl.data.nonce) {
              $ctrl.data.nonce = txCount;
            }
          });
        }

        $ctrl.transactions = [];
        var refreshTransactionsInterval = $interval(function() {
          if ($ctrl && $ctrl.data && $ctrl.data.address) {
            refreshTransactions();
          }
        }, 10000); // every 10s, refresh tx
        $scope.$on('$destroy', function() {
          $interval.cancel(refreshTransactionsInterval);
        });

        function refreshTransactions() {
          EthereumApis.getAddressTransactions($ctrl.data.address).then(function(transactions) {
            if (!$ctrl.data) {
              return;
            }

            transactions.forEach(function(transaction) {
              // pending transactions may have been mined
              var found = false;
              $ctrl.transactions.forEach(function(tx) {
                if (tx.txHash === transaction.hash) {
                  found = true;
                  tx.block = Number(transaction.blockNumber);
                  tx.isError = transaction.isError === '0' ? false : true;
                  tx.gasUsed = Number(transaction.gasUsed);
                }
              });

              if (found) {
                return;
              }

              $ctrl.transactions.push({
                txHash: transaction.hash,
                block: Number(transaction.blockNumber),
                gasUsed: Number(transaction.gasUsed),
                gasPrice: Number(transaction.gasPrice),
                time: Number(transaction.timeStamp) * 1000,
                from: transaction.from,
                to: transaction.to,
                value: Number(transaction.value) / 1e18,
                data: transaction.input,
                isError: transaction.isError === '0' ? false : true
              });
            });

            $ctrl.transactions = $ctrl.transactions.sort(function(a, b) {
              return a.time < b.time ? 1 : -1;
            });
            $ctrl.transactions = $ctrl.transactions.slice(0, 5);
          });
        }

        $ctrl.addTransaction = function addTransaction(tx) {
          $ctrl.transactions.unshift(tx);
          $ctrl.transactions = $ctrl.transactions.slice(0, 5);
        };

        $rootScope.$on('ethaddress.set', function($ev, data) {
          $ctrl.data = data;
          $ctrl.transactions = [];
          refreshTransactions();

          EthereumApis.getEthPrice().then(function(ethValue) {
            $ctrl.data.ethValue = ethValue;
          });

          refreshLastNonce();

          if ($ctrl.data.type === 'ledger') {
            $ctrl.data.promptTxSign = promptLedgerTxSign;
          } else if ($ctrl.data.type === 'metamask') {
            $ctrl.data.promptTxSign = promptMetamaskTxSign;
          } else {
            $ctrl.data.promptTxSign = function() {
              console.error('promptTxSign not implemented for type=', $ctrl.data.type);
            };
          }
        });

        function promptLedgerTxSign(args) {
          var raw = {
            nonce: '0x' + $ctrl.data.nonce.toString(16),
            gasPrice: '0x' + ((args.gasPrice || 1) * 1e9).toString(16),
            gasLimit: '0x' + ((args.gasLimit || 21000)).toString(16),
            to: args.to,
            value: '0x' + ((args.value || 0) * 1e18).toString(16),
            chainId: 1,
            r: '0x00',
            s: '0x00',
            v: '0x01',
            data: args.data || null
          };

          var txToSign = new $window.ethereumjs.Tx(raw).serialize().toString('hex');

          return $q(function(resolve, reject) {
            $window.ledger.comm_u2f.create_async(30).then(function(comm) {
              new $window.ledger.eth(comm).signTransaction_async($ctrl.data.path, txToSign).then(function(result) {
                raw.r = '0x' + result.r;
                raw.s = '0x' + result.s;
                raw.v = '0x' + result.v;
                var txSigned = new $window.ethereumjs.Tx(raw);
                txSigned._chainId = raw.chainId;
                txSigned._senderPubKey = $ctrl.data.publickey;

                $window.web3.eth.sendRawTransaction('0x' + txSigned.serialize().toString('hex'), function(err, txHash) {
                  if (err) {
                    reject(err);
                    return;
                  }
                  $ctrl.data.nonce++;

                  $ctrl.addTransaction({
                    txHash: txHash,
                    block: null,
                    gasUsed: null,
                    gasPrice: (args.gasPrice || 1) * 1e9,
                    time: Date.now(),
                    from: $ctrl.data.address,
                    to: raw.to,
                    value: args.value || 0,
                    isError: false,
                    data: raw.data
                  });

                  resolve(txHash);
                });
              }).catch(reject);
            }).catch(reject);
          });
        }

        function promptMetamaskTxSign(args) {
          return $q(function(resolve, reject) {
            var txData = {
              gasPrice: (args.gasPrice || 1) * 1e9,
              gas: args.gasLimit || 21000,
              from: $window.web3.eth.accounts[0],
              to: args.to,
              value: (args.value || 0) * 1e18,
              data: args.data || null
            };

            $window.web3.eth.sendTransaction(txData, function(err, txHash) {
              if (err) {
                reject(err);
                return;
              }
              $ctrl.data.nonce++;

              $ctrl.addTransaction({
                txHash: txHash,
                block: null,
                gasUsed: null,
                gasPrice: (args.gasPrice || 1) * 1e9,
                time: Date.now(),
                from: txData.from,
                to: txData.to,
                value: txData.value / 1e18,
                isError: false,
                data: txData.data
              });

              resolve(txHash);
            });
          });
        }
      }
    ]
  });
})(window);

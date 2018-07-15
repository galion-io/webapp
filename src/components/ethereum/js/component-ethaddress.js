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

        $interval(function() {
          if ($ctrl.data.address) {
            EthereumApis.getLastNonce($ctrl.data.address).then(function(nonce) {
              if (nonce > $ctrl.data.nonce) {
                $ctrl.data.nonce = nonce;
              }
            });
          }
        }, 60000); // every 1min, refresh nonce

        $rootScope.$on('ethaddress.set', function($ev, data) {
          $ctrl.data = data;

          EthereumApis.getEthPrice().then(function(ethValue) {
            $ctrl.data.ethValue = ethValue;
          });

          EthereumApis.getLastNonce(data.address).then(function(nonce) {
            $ctrl.data.nonce = nonce;
          });

          if ($ctrl.data.type === 'ledger') {
            $ctrl.data.promptTxSign = promptLedgerTxSign;
          } else {
            $ctrl.data.promptTxSign = function() {
              console.error('promptTxSign not implemented for type=', $ctrl.data.type);
            };
          }
        });

        function promptLedgerTxSign(args) {
          var raw = {
            nonce: '0x' + ($ctrl.data.nonce + 1).toString(16),
            gasPrice: '0x' + ((args.gasPrice || 1) * 1e9).toString(16),
            gasLimit: '0x' + ((args.gasLimit || 21000)).toString(16),
            to: args.to,
            value: '0x' + ((args.value || 0) * 1e18).toString(16),
            chainId: 1,
            r: '0x00',
            s: '0x00',
            v: '0x01',
            data: args.data || '0x'
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
                  resolve(txHash);
                });
              }).catch(reject);
            }).catch(reject);
          });
        }
      }
    ]
  });
})(window);

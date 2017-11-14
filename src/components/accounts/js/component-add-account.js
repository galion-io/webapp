'use strict';

(function closure(window) {
  window.angular.module('accounts').component('addAccount', {
    templateUrl: 'accounts/templates/add-account.html',
    bindings: {
      onsuccess: '&',
      portfolios: '<',
      portfolioid: '<'
    },
    controller: [
      'api',
      function(api) {
        var $ctrl = this;
        $ctrl.formData = {};
        $ctrl.error = null;

        this.types = [
          { id: 'kraken', label: 'Kraken account', isSecretKeyRequired: true },
          { id: 'ethereum', label: 'Ethereum wallet', isSecretKeyRequired: false },
          { id: 'bittrex', label: 'Bittrex account', isSecretKeyRequired: true }
        ];

        $ctrl.submit = function submit() {
          $ctrl.error = null;
          api.call('POST', '/AssetManagement/AddAccount', {
            portfolioid: $ctrl.portfolioid || $ctrl.formData.portfolio.portfolioid,
            name: $ctrl.formData.name,
            publickey: $ctrl.formData.publickey,
            privatekey: $ctrl.formData.privatekey || null,
            accounttype: $ctrl.formData.type.id
          }).then(function() {
            $ctrl.onsuccess && $ctrl.onsuccess();
          }).catch(function(err) {
            $ctrl.error = err;
          });
        };
      }
    ]
  });
})(window);

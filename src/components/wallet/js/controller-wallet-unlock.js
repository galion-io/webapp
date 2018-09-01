'use strict';

(function closure(window) {
  window.angular.module('wallet').controller('WalletUnlockCtrl', [
    '$rootScope',
    '$scope',
    'sidepanel',
    'value',
    '$filter',
    function($rootScope, $scope, sidepanel, value, $filter) {
      $scope.value = value;
      $scope.formData = { password: '' };

      $scope.$on('sidepanel.init', function(ev, wallet) {
        if (wallet) {
          $scope.wallet = wallet;
        } else {
          sidepanel.hide();
        }
      });

      // focus first input
      setTimeout(function() {
        window.document.querySelector('#form-galion-wallet-unlock-password').focus();
      }, 100);

      $scope.submitted = false;
      $scope.submit = function submit() {
        $scope.submitted = true;
        sidepanel.hide();
      };

      $scope.$on('$destroy', function() {
        if ($scope.submitted) {
          $scope.wallet.cb(null, $scope.formData.password);
        } else {
          $scope.wallet.cb({
            code: 'NOPASSWORD',
            message: $filter('translate')('WALLET.UNLOCK.ERR_NOPASSWORD')
          });
        }
      });

      $scope.closeSidepanel = sidepanel.hide;
    }]);
})(window);

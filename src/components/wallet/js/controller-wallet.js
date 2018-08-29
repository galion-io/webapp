'use strict';

(function closure(window) {
  window.angular.module('wallet').controller('WalletCtrl', [
    '$scope',
    'value',
    'api',
    'apiUtils',
    'prompt',
    function($scope, value, api, apiUtils, prompt) {
      $scope.init = function() {
        $scope.data = { password: '' };
        $scope.loading = true;
        $scope.assets = null;
        $scope.error = null;

        api.getMyAssets(value.getDisplayCurrency(), true).then(function(assets) {
          $scope.guw = apiUtils.getGuw(assets);
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };
      $scope.init();

      $scope.deleteGuw = function deleteGuw() {
        return api.call('POST', '/limited2/GUW/Delete').then(function() {
          $scope.init();
        }).catch(function(err) {
          $scope.error = err;
        });
      };

      $scope.createGuw = function createGuw() {
        var password = $scope.data.password;
        if (!password.length) {
          return;
        }

        prompt.show('PROMPT.CREATE_WALLET.TITLE', 'PROMPT.CREATE_WALLET.TEXT', [{
          label: 'PROMPT.CREATE_WALLET.ACTION_CONFIRM',
          do: function() {
            return api.createGalionWallet(password).then(function() {
              $scope.init();
            }).catch(function(err) {
              $scope.error = err;
            });
          },
          success: 'wallet.created'
        }]);
      };
    }]);
})(window);

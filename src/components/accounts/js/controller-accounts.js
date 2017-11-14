'use strict';

(function closure(window) {
  window.angular.module('accounts').controller('AccountsCtrl', [
    '$window',
    '$scope',
    'api',
    'apiUtils',
    function($window, $scope, api, apiUtils) {
      $scope.init = function() {
        $scope.loading = true;
        $scope.portfolios = null;
        $scope.accounts = null;
        $scope.error = null;

        api.getMyAssets().then(function(assets) {
          $scope.portfolios = apiUtils.portfolios(assets);
          $scope.accounts = apiUtils.accounts(assets);
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };

      $scope.init();
    }]);
})(window);

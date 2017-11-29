'use strict';

(function closure(window) {
  window.angular.module('dashboard').controller('DashboardCtrl', [
    '$window',
    '$scope',
    'api',
    'apiUtils',
    '$state',
    function($window, $scope, api, apiUtils, $state) {
      $scope.init = function() {
        $scope.portfolios = null;
        $scope.accounts = null;
        $scope.myAssets = null;
        $scope.assets = null;
        $scope.values = null;
        $scope.error = null;

        api.getMyAssets().then(function(myAssets) {
          $scope.myAssets = myAssets;
          var portfolios = apiUtils.portfolios(myAssets);
          var accounts = apiUtils.accounts(myAssets);
          $scope.portfolios = portfolios;
          $scope.accounts = accounts;

          if (portfolios.length === 0 || accounts.length === 0) {
            $state.go('app.portfolios');
          }
        }).catch(function(err) {
          $scope.error = err;
        });

        api.getAssetsLastValues().then(function(values) {
          $scope.values = values;
        }).catch(function(err) {
          $scope.error = err;
        });

        api.getAssets().then(function(assets) {
          $scope.assets = assets;
        }).catch(function(err) {
          $scope.error = err;
        });
      };

      $scope.init();
    }]);
})(window);

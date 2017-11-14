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
        $scope.wallets = null;
        $scope.myAssets = null;
        $scope.assets = null;
        $scope.values = null;
        $scope.error = null;

        api.getMyAssets().then(function(myAssets) {
          $scope.myAssets = myAssets;
          $scope.portfolios = apiUtils.portfolios(myAssets);
          $scope.wallets = apiUtils.wallets(myAssets);
          window.myAssets = $scope.myAssets;
          window.portfolios = $scope.portfolios;
          window.wallets = $scope.wallets;

          if ($scope.portfolios.length === 0 || $scope.wallets.length === 0) {
            $state.go('app.portfolios');
          }
        }).catch(function(err) {
          $scope.error = err;
        });

        api.getAssetsLastValues().then(function(values) {
          $scope.values = values;
          window.values = values;
        }).catch(function(err) {
          $scope.error = err;
        });

        api.getAssets().then(function(assets) {
          $scope.assets = assets;
          window.assets = assets;
        }).catch(function(err) {
          $scope.error = err;
        });
      };

      $scope.init();
    }]);
})(window);

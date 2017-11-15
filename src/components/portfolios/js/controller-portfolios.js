'use strict';

(function closure(window) {
  window.angular.module('portfolios').controller('PortfoliosCtrl', [
    '$window',
    '$scope',
    'api',
    'apiUtils',
    function($window, $scope, api, apiUtils) {
      $scope.init = function() {
        $scope.loading = true;
        $scope.portfolios = null;
        $scope.error = null;

        api.getMyAssets().then(function(assets) {
          $scope.portfolios = apiUtils.portfolios(assets).map(function(portfolio) {
            portfolio.var24 = Math.random() - 0.5;
            portfolio.var168 = Math.random() - 0.5;
            portfolio.assets = [
              { volume: 150, symbol: 'ETH' },
              { volume: 3, symbol: 'BTC' },
              { volume: 10, symbol: 'SAN' },
              { volume: 2344578564, symbol: 'MCO' },
              { volume: 13.4556666778, symbol: 'DASH' }
            ];
            portfolio.balanceText = '123,456.78 $';
            return portfolio;
          });
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };

      $scope.init();
    }]);
})(window);

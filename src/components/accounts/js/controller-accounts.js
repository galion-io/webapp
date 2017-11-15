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
          $scope.portfolios = apiUtils.portfolios(assets).map(function(portfolio) {
            portfolio.accounts = portfolio.accounts.map(function(account) {
              account.var24 = Math.random() - 0.5;
              account.var168 = Math.random() - 0.5;
              account.assets = [
                { volume: 150, symbol: 'ETH' },
                { volume: 3, symbol: 'BTC' },
                { volume: 10, symbol: 'SAN' },
                { volume: 2344578564, symbol: 'MCO' },
                { volume: 13.4556666778, symbol: 'DASH' }
              ];
              account.balanceText = '123,456.78 $';
              return account;
            });
            return portfolio;
          });
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

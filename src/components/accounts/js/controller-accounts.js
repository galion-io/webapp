'use strict';

(function closure(window) {
  window.angular.module('accounts').controller('AccountsCtrl', [
    '$window',
    '$filter',
    '$scope',
    'api',
    'apiUtils',
    'sidepanel',
    function($window, $filter, $scope, api, apiUtils, sidepanel) {
      $scope.init = function(forceRefresh) {
        $scope.loading = true;
        $scope.portfolios = null;
        $scope.accounts = null;
        $scope.error = null;

        api.getMyAssets(forceRefresh).then(function(assets) {
          $scope.portfolios = apiUtils.portfolios(assets).map(function(portfolio) {
            portfolio.accounts = portfolio.accounts.map(function(account) {
              account.var24 = Math.random() - 0.5;
              account.var168 = Math.random() - 0.5;
              account.assets = apiUtils.accountAssets(account);
              account.balanceText = $filter('strvalue')(account.values);
              return account;
            });
            return portfolio;
          });
          $scope.accounts = apiUtils.accounts({ portfolios: $scope.portfolios });
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };

      $scope.init();
      $scope.$on('accounts.refresh', function() {
        $scope.init(true);
      });

      $scope.promptAccountAddition = function promptAccountAddition(portfolioid) {
        sidepanel.show('accounts/templates/panel-add-account.html', {
          portfolios: $scope.portfolios,
          portfolioid: portfolioid
        });
      };
    }]);
})(window);

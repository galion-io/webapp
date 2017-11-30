'use strict';

(function closure(window) {
  window.angular.module('accounts').controller('AccountsCtrl', [
    '$window',
    '$filter',
    '$scope',
    'api',
    'apiUtils',
    'sidepanel',
    'prompt',
    function($window, $filter, $scope, api, apiUtils, sidepanel, prompt) {
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

      $scope.promptDelete = function promptDelete(portfolioid, id) {
        prompt.show('PROMPT.DELETE_ACCOUNT.TITLE', 'PROMPT.DELETE_ACCOUNT.TEXT', [{
          label: 'PROMPT.DELETE_ACCOUNT.ACTION_CONFIRM',
          do: $scope.doDelete.bind($scope, portfolioid, id),
          success: 'accounts.refresh'
        }]);
      };

      $scope.doDelete = function(portfolioid, id) {
        return api.call('DELETE', '/AssetManagement/DeleteAccount', {
          id: id,
          portfolioid: portfolioid
        });
      };
    }]);
})(window);

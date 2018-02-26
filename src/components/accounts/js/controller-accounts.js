'use strict';

(function closure(window) {
  window.angular.module('accounts').controller('AccountsCtrl', [
    '$window',
    '$scope',
    'api',
    'apiUtils',
    'sidepanel',
    'prompt',
    'value',
    function($window, $scope, api, apiUtils, sidepanel, prompt, value) {
      $scope.value = value;

      $scope.init = function(forceRefresh) {
        $scope.loading = true;
        $scope.portfolios = null;
        $scope.accounts = null;
        $scope.error = null;

        api.getMyAssets(value.getDisplayCurrency(), forceRefresh).then(function(assets) {
          $scope.portfolios = apiUtils.portfolios(assets).map(function(portfolio) {
            portfolio.accounts = portfolio.accounts.map(function(account) {
              account.assets = apiUtils.accountAssets(account);
              if (account.editable === undefined) {
                account.editable = true;
              }
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

      $scope.promptForm = function promptForm(account) {
        sidepanel.show('accounts/templates/panel-form-account.html', account);
      };

      $scope.promptMove = function promptDelete(portfolios, account, accountPortfolioId) {
        sidepanel.show('accounts/templates/panel-move-account.html', {
          portfolios: portfolios,
          account: account,
          accountPortfolioId: accountPortfolioId
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
        return api.deleteAccount(portfolioid, id);
      };
    }]);
})(window);

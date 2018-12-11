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
          $scope.accountsleft = assets.accountsleft;
          $scope.portfolios = apiUtils.portfolios(assets).map(function(portfolio) {
            portfolio.accounts = portfolio.accounts.map(function(account) {
              account.assets = apiUtils.accountAssets(account);
              if (account.editable === undefined) {
                account.editable = true;
              }
              return account;
            });
            var id = 0;
            var groups = portfolio.accounts.reduce(function(acc, cur) {
              var groupid = cur.groupid || (++id)
              acc[groupid] = acc[groupid] || [];
              acc[groupid].push(cur);
              return acc;
            }, {});
            portfolio.accounts = []
            for (var key in groups) {
              portfolio.accounts.push(groups[key]);
            }
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
      $scope.$on('portfolios.refresh', function() {
        $scope.init(true);
      });
      $scope.$on('accounts.refresh', function() {
        $scope.init(true);
      });

      $scope.promptPortfolioForm = function promptPortfolioForm() {
        sidepanel.show('portfolios/templates/panel-form-portfolio.html');
      };

      $scope.promptForm = function promptForm(account) {
        sidepanel.show('accounts/templates/panel-form-account.html', account);
      };

      $scope.promptOperations = function promptOperations(account) {
        sidepanel.show('accounts/templates/panel-operations.html', account);
      };

      $scope.promptOperationAdd = function promptOperationAdd(account) {
        sidepanel.show('accounts/templates/panel-operation-add.html', account);
      };

      $scope.promptMove = function promptDelete(portfolios, account, accountPortfolioId) {
        sidepanel.show('accounts/templates/panel-move-account.html', {
          portfolios: portfolios,
          account: account,
          accountPortfolioId: accountPortfolioId
        });
      };

      $scope.promptDelete = function promptDelete(portfolioid, id) {
        if (id != null) {
          prompt.show('PROMPT.DELETE_ACCOUNT.TITLE', 'PROMPT.DELETE_ACCOUNT.TEXT', [{
            label: 'PROMPT.DELETE_ACCOUNT.ACTION_CONFIRM',
            do: $scope.doDelete.bind($scope, portfolioid, id),
            success: 'accounts.refresh'
          }]);
        } else {
          prompt.show('PROMPT.DELETE_GROUP.TITLE', 'PROMPT.DELETE_GROUP.TEXT', [{
            label: 'PROMPT.DELETE_GROUP.ACTION_CONFIRM',
            do: $scope.doDeleteGroup.bind($scope, portfolioid),
            success: 'accounts.refresh'
          }]);
        }
      };

      $scope.doDelete = function(portfolioid, id) {
        return api.deleteAccount(portfolioid, id);
      };

      $scope.doDeleteGroup = function(groupId) {
        return api.deleteAccountGroup(groupId);
      };

      $scope.showRequest = function showRequest(state) {
        return state !== 'Completed' && state !== 'Overpaid';
      };
    }]);
})(window);

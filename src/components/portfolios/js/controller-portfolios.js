'use strict';

(function closure(window) {
  window.angular.module('portfolios').controller('PortfoliosCtrl', [
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
        $scope.error = null;

        api.getMyAssets(forceRefresh).then(function(assets) {
          $scope.portfolios = apiUtils.portfolios(assets).map(function(portfolio) {
            portfolio.var24 = Math.random() - 0.5;
            portfolio.var168 = Math.random() - 0.5;
            portfolio.assets = apiUtils.portfolioAssets(portfolio);
            return portfolio;
          });
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

      $scope.promptForm = function promptForm(portfolio) {
        sidepanel.show('portfolios/templates/panel-form-portfolio.html', portfolio);
      };

      $scope.promptDelete = function promptDelete(portfolioid, id) {
        prompt.show('PROMPT.DELETE_PORTFOLIO.TITLE', 'PROMPT.DELETE_PORTFOLIO.TEXT', [{
          label: 'PROMPT.DELETE_PORTFOLIO.ACTION_CONFIRM',
          do: $scope.doDelete.bind($scope, portfolioid, id),
          success: 'portfolios.refresh'
        }]);
      };

      $scope.doDelete = function(id) {
        return api.call('DELETE', '/AssetManagement/DeletePortfolio', {
          id: id
        });
      };
    }]);
})(window);

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
    '$timeout',
    'chart',
    function($window, $filter, $scope, api, apiUtils, sidepanel, prompt, $timeout, chart) {
      $scope.init = function(forceRefresh) {
        $scope.loading = true;
        $scope.portfolios = null;
        $scope.error = null;

        api.getMyAssets(forceRefresh).then(function(assets) {
          $scope.portfolios = apiUtils.portfolios(assets).map(function(portfolio) {
            portfolio.assets = apiUtils.portfolioAssets(portfolio);
            return portfolio;
          });

          $timeout($scope.initCharts);
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

      $scope.initCharts = function() {
        $scope.portfolios.forEach(function(portfolio) {
          portfolio.loadingHistory = true;
          api.getPortfolioHistory(portfolio.id, 21).then(function(history) {
            portfolio.history = history;
            portfolio.history.push({
              value: portfolio.values[0].value,
              time: Date.now()
            });

            if (portfolio.history.length < 2) {
              portfolio.nodata = true;
              return;
            }

            portfolio.var24 = chart.getVar(history, Date.now() - 24 * 36e5);
            portfolio.var168 = chart.getVar(history, Date.now() - 168 * 36e5);

            chart.drawLine('portfolio-' + portfolio.id, history, 9);
          }).catch(function(err) {
            portfolio.errorHistory = err;
          }).finally(function() {
            portfolio.loadingHistory = false;
          });
        });
      };
    }]);
})(window);

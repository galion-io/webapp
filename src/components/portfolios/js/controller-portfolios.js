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
    'value',
    'settings',
    function($window, $filter, $scope, api, apiUtils, sidepanel, prompt, $timeout, chart, value, settings) {
      $scope.value = value;

      function getHistorySettings(portfolio) {
        return settings.get('portfolio-' + portfolio.id + '-history', settings.get('dashboard-history', 'all'));
      }

      function getMaxpointsSettings(portfolio) {
        return settings.get('portfolio-' + portfolio.id + '-maxpoints', settings.get('dashboard-maxpoints', 0));
      }

      $scope.init = function(forceRefresh) {
        $scope.loading = true;
        $scope.portfolios = null;
        $scope.error = null;

        api.getMyAssets(value.getDisplayCurrency(), forceRefresh).then(function(assets) {
          $scope.portfoliosleft = assets.portfoliosleft;
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
        return api.deletePortfolio(id);
      };

      $scope.initCharts = function() {
        $scope.portfolios.forEach(function(portfolio) {
          portfolio.loadingHistory = true;
          api.getPortfolioHistory(portfolio.id, value.getDisplayCurrency(), getHistorySettings(portfolio)).then(function(history) {
            portfolio.history = history;
            portfolio.history.push({
              value: portfolio.value,
              time: portfolio.updatedate
            });

            if (portfolio.history.length < 2) {
              portfolio.nodata = true;
              return;
            }

            portfolio.var24 = chart.getVar(history, portfolio.updatedate - 24 * 36e5);
            portfolio.var168 = chart.getVar(history, portfolio.updatedate - 168 * 36e5);

            portfolio.showVar168 = portfolio.history[0].time <= portfolio.updatedate - 7 * 24 * 36e5;

            chart.drawLine('portfolio-' + portfolio.id, history, getMaxpointsSettings(portfolio));
          }).catch(function(err) {
            portfolio.errorHistory = err;
          }).finally(function() {
            portfolio.loadingHistory = false;
          });
        });
      };
    }]);
})(window);

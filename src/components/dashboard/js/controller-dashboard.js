'use strict';

(function closure(window) {
  window.angular.module('dashboard').controller('DashboardCtrl', [
    '$window',
    '$q',
    '$scope',
    '$filter',
    'api',
    'apiUtils',
    'value',
    'chart',
    'settings',
    'sidepanel',
    '$timeout',
    function($window, $q, $scope, $filter, api, apiUtils, value, chart, settings, sidepanel, $timeout) {
      $scope.data = {};
      $scope.loading = false;
      $scope.error = null;
      $scope.value = value;

      $scope.showPortfolioForm = function showPortfolioForm() {
        sidepanel.show('portfolios/templates/panel-form-portfolio.html');
      };

      $scope.$on('portfolios.refresh', $scope.init);

      $scope.showAccountForm = function showAccountForm() {
        sidepanel.show('accounts/templates/panel-form-account.html', {
          portfolioid: $scope.data.portfolios[0].id
        });
      };

      $scope.$on('accounts.refresh', $scope.init);

      function getHistorySettings() {
        return settings.get('dashboard-history', 'all');
      }
      $scope.getHistorySettings = getHistorySettings;

      function getMaxpointsSettings() {
        return settings.get('dashboard-maxpoints', 0);
      }
      $scope.getMaxpointsSettings = getMaxpointsSettings;

      $scope.setHistory = function setHistory(v) {
        var key = 'dashboard-history';
        settings.set(key, v);
        return reloadMainHistory().then(drawMainChart);
      };

      $scope.toggleMaxpoints = function toggleMaxpoints() {
        var key = 'dashboard-maxpoints';
        if (settings.get(key, 0) === 0) {
          settings.set(key, 15);
        } else {
          settings.set(key, 0);
        }
        return reloadMainHistory().then(drawMainChart);
      };

      $scope.color = {
        positive: '#55F684',
        positive_alpha: '#D9F2DD',
        negative: '#E78DB0',
        negative_alpha: '#F2E3E8'
      };

      var retryTimeout = null;
      $scope.init = function() {
        $scope.data = {};
        $scope.loading = true;
        $scope.error = null;
        $q.all([
          getMyAssetsAndPortfoliosHistory(),
          getMyDashboardAndMainHistoryAndAssetsHistory()
        ]).then(drawCharts).then(function() {
          if ($scope.data.portfolios.length && $scope.data.accounts.length && $scope.data.history.length < 2) {
            retryTimeout = $timeout(function() {
              $scope.init();
            }, 65000); // 65s
          }
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };
      $scope.init();

      $scope.$on('$destroy', function() {
        $timeout.cancel(retryTimeout);
      });

      function getMyAssetsAndPortfoliosHistory() {
        return api.getMyAssets().then(function(myAssets) {
          $scope.data.portfolios = apiUtils.portfolios(myAssets);
          $scope.data.accounts = apiUtils.accounts(myAssets);
          $scope.data.operations = myAssets.operations;
        }).then(function() {
          return $q.all($scope.data.portfolios.map(function(portfolio) {
            return getPortfolioHistory(portfolio);
          }));
        });
      }

      function getMyDashboardAndMainHistoryAndAssetsHistory() {
        return api.getMyDashboard().then(function(myDashboard) {
          myDashboard.dashboardassets = myDashboard.dashboardassets.sort(function(a, b) {
            return a.value > b.value ? -1 : 1;
          });

          $scope.data.dashboard = myDashboard;

          return $q.all(myDashboard.dashboardassets.map(function(asset) {
            return api.getCurrencyHistory(asset.mappedcurrencyid).then(function(history) {
              asset.history = history;
              asset.var24 = chart.getVar(history, Date.now() - 24 * 36e5);
              asset.var24Value = chart.getVarValue(history, Date.now() - 24 * 36e5);
              asset.var168 = chart.getVar(history, Date.now() - 168 * 36e5);
              asset.var168Value = chart.getVarValue(history, Date.now() - 168 * 36e5);
            });
          }));
        }).then(reloadMainHistory);
      }

      function drawCharts() {
        setTimeout(function() {
          drawPortfolioCharts();
          drawAssetsCharts();
          drawMainChart();
        }, 10);
      }

      function drawPortfolioCharts() {
        $scope.data.portfolios.forEach(function(portfolio) {
          if (!portfolio.history || portfolio.history.length < 2) {
            return;
          }

          chart.drawLine('portfolio-' + portfolio.id, portfolio.history, 10, {
            nopoints: true,
            noaxis: true,
            lineColor: portfolio.var168 > 0 ? $scope.color.positive : $scope.color.negative,
            fillColor: portfolio.var168 > 0 ? $scope.color.positive_alpha : $scope.color.negative_alpha
          });
        });
      }

      function drawAssetsCharts() {
        $scope.data.dashboard.dashboardassets.forEach(function(asset) {
          if (!asset.history || asset.history.length < 2) {
            return;
          }

          chart.drawLine('asset-' + asset.mappedcurrencyid, asset.history, 10, {
            nopoints: true,
            noaxis: true,
            lineColor: asset.var168 > 0 ? $scope.color.positive : $scope.color.negative,
            fillColor: asset.var168 > 0 ? $scope.color.positive_alpha : $scope.color.negative_alpha
          });
        });
      }

      var _mainChart = null;
      function drawMainChart() {
        if (_mainChart) {
          _mainChart.removeAndDestroy();
          _mainChart = null;
        }
        if (!$scope.data || !$scope.data.history || $scope.data.history.length < 2) {
          return;
        }

        _mainChart = chart.drawLine('mainchart', $scope.data.history, getMaxpointsSettings());
      }

      function getPortfolioHistory(portfolio) {
        return api.getPortfolioHistory(portfolio.id, value.getDisplayCurrency()).then(function(history) {
          portfolio.history = history;
          portfolio.history.push({
            value: portfolio.value,
            time: Date.now()
          });
          portfolio.var168 = chart.getVar(portfolio.history, Date.now() - 168 * 36e5);
          portfolio.var168Value = chart.getVarValue(portfolio.history, Date.now() - 168 * 36e5);
        });
      }

      function reloadMainHistory() {
        return api.getMyHistory(null, getHistorySettings()).then(function(myHistory) {
          myHistory.push({
            time: Date.now(),
            value: $scope.data.dashboard.totalvalue
          });

          $scope.data.history = myHistory;
          $scope.data.var = chart.getVar(myHistory, 0);
          $scope.data.varValue = chart.getVarValue(myHistory, 0);
        });
      }
    }]);
})(window);

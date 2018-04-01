'use strict';

(function closure(window) {
  window.angular.module('dashboard').controller('DashboardCtrl', [
    '$window',
    '$q',
    '$scope',
    '$filter',
    'api',
    'value',
    'chart',
    'settings',
    function($window, $q, $scope, $filter, api, value, chart, settings) {
      $scope.data = {};
      $scope.loading = false;
      $scope.error = null;
      $scope.value = value;
      $scope.tz = 'GMT+' + new Date().toString().split('GMT+')[1].split(' (')[0];

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
        return reloadMainHistory();
      };

      $scope.toggleMaxpoints = function toggleMaxpoints() {
        var key = 'dashboard-maxpoints';
        if (settings.get(key, 0) === 0) {
          settings.set(key, 15);
        } else {
          settings.set(key, 0);
        }
        return reloadMainHistory();
      };

      $scope.color = {
        positive: '#55F684',
        positive_alpha: '#D9F2DD',
        negative: '#E78DB0',
        negative_alpha: '#F2E3E8'
      };

      $scope.init = function() {
        $scope.data = {};
        $scope.loading = true;
        $scope.error = null;
        $q.all([
          api.getMyAssets().then(function(myAssets) {
            $scope.data.portfolios = myAssets.portfolios;

            $scope.data.operations = myAssets.operations;

            $scope.data.portfolios.forEach(function(portfolio) {
              api.getPortfolioHistory(portfolio.id, value.getDisplayCurrency()).then(function(history) {
                portfolio.history = history;
                portfolio.history.push({
                  value: portfolio.value,
                  time: Date.now()
                });

                portfolio.var168 = chart.getVar(portfolio.history, portfolio.updatedate - 168 * 36e8);

                setTimeout(function() {
                  chart.drawLine('portfolio-' + portfolio.id, portfolio.history, 10, {
                    nopoints: true,
                    noaxis: true,
                    lineColor: portfolio.var168 > 0 ? $scope.color.positive : $scope.color.negative,
                    fillColor: portfolio.var168 > 0 ? $scope.color.positive_alpha : $scope.color.negative_alpha
                  });
                });
              });
            });
          }),
          api.getMyDashboard().then(function(myDashboard) {
            myDashboard.dashboardassets = myDashboard.dashboardassets.sort(function(a, b) {
              return a.value > b.value ? -1 : 1;
            });
            myDashboard.dashboardassets = myDashboard.dashboardassets.map(function(asset) {
              asset.loading = true;
              api.getCurrencyHistory(asset.mappedcurrencyid).then(function(history) {
                asset.history = history;
                asset.var24 = chart.getVar(history, Date.now() - 24 * 36e5);
                asset.var168 = chart.getVar(history, Date.now() - 168 * 36e5);

                setTimeout(function() {
                  chart.drawLine('asset-' + asset.mappedcurrencyid, history, 10, {
                    nopoints: true,
                    noaxis: true,
                    lineColor: asset.var168 > 0 ? $scope.color.positive : $scope.color.negative,
                    fillColor: asset.var168 > 0 ? $scope.color.positive_alpha : $scope.color.negative_alpha
                  });
                });
              });

              return asset;
            });
            $scope.data.dashboard = myDashboard;

            return reloadMainHistory();
          })
        ]).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };
      $scope.init();

      var _mainChart = null;
      function reloadMainHistory() {
        return api.getMyHistory(null, getHistorySettings()).then(function(myHistory) {
          myHistory.push({
            time: Date.now(),
            value: $scope.data.dashboard.totalvalue
          });

          $scope.data.history = myHistory;
          $scope.data.var24 = chart.getVar(myHistory, Date.now() - 24 * 36e5);
          $scope.data.var168 = chart.getVar(myHistory, Date.now() - 168 * 36e5);

          if (_mainChart) {
            _mainChart.removeAndDestroy();
          }
          _mainChart = chart.drawLine('mainchart', $scope.data.history, getMaxpointsSettings());
        });
      }
    }]);
})(window);

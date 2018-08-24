'use strict';

(function closure(window) {
  window.angular.module('dashboard').controller('PortfolioCtrl', [
    '$window',
    '$q',
    '$scope',
    '$filter',
    'api',
    'apiUtils',
    'value',
    'chart',
    'settings',
    '$stateParams',
    '$timeout',
    function($window, $q, $scope, $filter, api, apiUtils, value, chart, settings, $stateParams, $timeout) {
      $scope.data = {};
      $scope.loading = false;
      $scope.error = null;
      $scope.value = value;

      $scope.back = function() {
        $window.history.back();
      };

      function getPortfolioId() {
        if ($scope.data && $scope.data.portfolio && $scope.data.portfolio.id) {
          return $scope.data.portfolio.id;
        }
        return 'default';
      }

      function getHistorySettings() {
        return settings.get('portfolio-' + getPortfolioId() + '-history', 'all');
      }
      $scope.getHistorySettings = getHistorySettings;

      function getMaxpointsSettings() {
        return settings.get('portfolio-' + getPortfolioId() + '-maxpoints', 0);
      }
      $scope.getMaxpointsSettings = getMaxpointsSettings;

      $scope.setHistory = function setHistory(v) {
        var key = 'portfolio-' + getPortfolioId() + '-history';
        settings.set(key, v);
        return reloadMainHistory().then(drawMainChart);
      };

      $scope.toggleMaxpoints = function toggleMaxpoints() {
        var key = 'portfolio-' + getPortfolioId() + '-maxpoints';
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

        api.getMyAssets().then(function(myAssets) {
          var portfolio = myAssets.portfolios.filter(function(p) {
            return p.id === Number($stateParams.portfolioid);
          })[0];
          $scope.data.portfolio = portfolio;
        }).then(function() {
          return reloadMainHistory();
        }).then(function() {
          $scope.data.assets = apiUtils.portfolioAssets($scope.data.portfolio);

          $scope.data.assets = $scope.data.assets.sort(function(a, b) {
            return a.value > b.value ? -1 : 1;
          }).filter(function(a) {
            return a.value > 0;
          });
          return $q.all($scope.data.assets.map(function(asset) {
            asset.loading = true;
            return api.getCurrencyHistory(asset.mappedcurrencyid).then(function(history) {
              asset.history = history;
              asset.var24 = chart.getVar(history, Date.now() - 24 * 36e5);
              asset.var24Value = chart.getVarValue(history, Date.now() - 24 * 36e5);
              asset.var168 = chart.getVar(history, Date.now() - 168 * 36e5);
              asset.var168Value = chart.getVarValue(history, Date.now() - 168 * 36e5);
            });
          }));
        }).then(drawCharts).then(function() {
          if ($scope.data.portfolio && $scope.data.portfolio.history && $scope.data.portfolio.history.length < 2) {
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

      var _mainChart = null;
      function drawCharts() {
        setTimeout(function() {
          drawMainChart();
          drawCurrencyCharts();
        }, 10);
      }

      function drawMainChart() {
        if (_mainChart) {
          _mainChart.removeAndDestroy();
        }
        if ($scope.data.portfolio.history.length >= 2) {
          _mainChart = chart.drawLine(
            'mainchart',
            $scope.data.portfolio.history,
            getMaxpointsSettings()
          );
        }
      }

      function drawCurrencyCharts() {
        $scope.data.assets.forEach(function(asset) {
          if (asset.history.length > 2) {
            chart.drawLine('asset-' + asset.mappedcurrencyid, asset.history, 10, {
              nopoints: true,
              noaxis: true,
              lineColor: asset.var168 > 0 ? $scope.color.positive : $scope.color.negative,
              fillColor: asset.var168 > 0 ? $scope.color.positive_alpha : $scope.color.negative_alpha
            });
          }
        });
      }

      function reloadMainHistory() {
        return api.getPortfolioHistory($scope.data.portfolio.id, null, getHistorySettings()).then(function(history) {
          history.push({
            time: Date.now(),
            value: $scope.data.portfolio.value
          });

          $scope.data.portfolio.history = history;
          $scope.data.portfolio.var24 = chart.getVar(history, $scope.data.portfolio.updatedate - 24 * 36e5);
          $scope.data.portfolio.var168 = chart.getVar(history, $scope.data.portfolio.updatedate - 168 * 36e5);
        });
      }
    }]);
})(window);

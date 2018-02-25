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
    function($window, $q, $scope, $filter, api, apiUtils, value, chart, settings, $stateParams) {
      $scope.data = {};
      $scope.loading = false;
      $scope.error = null;
      $scope.value = value;

      var pref = settings.get();
      $scope.settings = {
        maxpoints: pref.maxpoints !== undefined ? pref.maxpoints : 0,
        history: pref.history || 'all' // day/week/month/sixmonth/all
      };

      $scope.setHistory = function setHistory(v) {
        $scope.settings.history = v;
        settings.set('history', v);
        return reloadMainHistory();
      };

      $scope.toggleMaxpoints = function toggleMaxpoints() {
        if ($scope.settings.maxpoints) {
          $scope.settings.maxpoints = 0;
        } else {
          $scope.settings.maxpoints = 15;
        }
        settings.set('maxpoints', $scope.settings.maxpoints);
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
          });
          $scope.data.assets = $scope.data.assets.map(function(asset) {
            asset.loading = true;
            asset.history = api.getCurrencyHistory(asset.currencyid).then(function(history) {
              asset.var24 = chart.getVar(history, Date.now() - 24 * 36e5);
              asset.var168 = chart.getVar(history, Date.now() - 168 * 36e5);

              setTimeout(function() {
                chart.drawLine('asset-' + asset.currencyid, history, 10, {
                  nopoints: true,
                  noaxis: true,
                  lineColor: asset.var168 > 0 ? $scope.color.positive : $scope.color.negative,
                  fillColor: asset.var168 > 0 ? $scope.color.positive_alpha : $scope.color.negative_alpha
                });
              });
            });

            return asset;
          });
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };
      $scope.init();

      var _mainChart = null;
      function reloadMainHistory() {
        return api.getPortfolioHistory($scope.data.portfolio.id, $scope.settings.history).then(function(history) {
          history.push({
            time: Date.now(),
            value: $scope.data.portfolio.value
          });

          $scope.data.portfolio.history = history;
          $scope.data.portfolio.var24 = chart.getVar(history, Date.now() - 24 * 36e5);
          $scope.data.portfolio.var168 = chart.getVar(history, Date.now() - 168 * 36e5);

          if (_mainChart) {
            _mainChart.removeAndDestroy();
          }
          _mainChart = chart.drawLine('mainchart', $scope.data.portfolio.history, $scope.settings.maxpoints);
        });
      }
    }]);
})(window);

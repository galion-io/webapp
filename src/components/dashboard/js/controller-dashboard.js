'use strict';

(function closure(window) {
  window.angular.module('dashboard').controller('DashboardCtrl', [
    '$window',
    '$q',
    '$scope',
    '$filter',
    'api',
    'chart',
    function($window, $q, $scope, api, chart) {
      $scope.data = {};
      $scope.loading = false;
      $scope.error = null;

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

            $scope.data.portfolios.forEach(function(portfolio) {
              api.getPortfolioHistory(portfolio.id, 21).then(function(history) {
                portfolio.history = history;
                portfolio.history.push({
                  value: portfolio.values[0].value,
                  time: Date.now()
                });

                portfolio.var168 = chart.getVar(portfolio.history, Date.now() - 168 * 36e8);

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
              asset.history = api.getCurrencyHistory(asset.mappedcurrencyid).then(function(history) {
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

            var pieData = [];
            var addedSoFar = 0;
            var skipped = 0;
            myDashboard.dashboardassets.forEach(function(asset, i) {
              if ((addedSoFar / myDashboard.totalvalue) > 0.98 && i !== myDashboard.dashboardassets.length - 1) {
                skipped++;
                return;
              }
              pieData.push({
                label: asset.mappedlabel,
                value: asset.value
              });
              addedSoFar += asset.value;
            });
            if (addedSoFar !== myDashboard.totalvalue) {
              pieData.push({
                label: $filter('translate')('DASHBOARD.ASSETS.PIE_OTHER', { n: skipped }),
                value: myDashboard.totalvalue - addedSoFar,
                color: '#777'
              });
            }
            chart.drawPie('assets', pieData);

            return api.getMyHistory().then(function(myHistory) {
              myHistory.push({
                time: Date.now(),
                value: $scope.data.dashboard.totalvalue
              });

              $scope.data.history = myHistory;
              $scope.data.var24 = chart.getVar(myHistory, Date.now() - 24 * 36e5);
              $scope.data.var168 = chart.getVar(myHistory, Date.now() - 168 * 36e5);

              chart.drawLine('mainchart', $scope.data.history, 15);
            });
          })
        ]).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };
      $scope.init();
    }]);
})(window);

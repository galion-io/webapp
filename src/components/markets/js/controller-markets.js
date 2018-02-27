'use strict';

(function closure(window) {
  window.angular.module('markets').controller('MarketsCtrl', [
    '$scope',
    'api',
    'value',
    function($scope, api, value) {
      $scope.multiplier = 1;
      $scope.value = value;
      $scope.sort = 'rank';
      var assets = [];

      api.getMyDashboard().then(function(myDashboard) {
        assets = myDashboard.dashboardassets.map(function(e) {
          return e.symbol;
        });
      });

      $scope.hasAsset = function(symbol) {
        return assets.indexOf(symbol) !== -1;
      };

      $scope.toggleSort = function(s) {
        if ($scope.sort === s) {
          $scope.sort = ('-' + s).replace('--', '');
        } else {
          $scope.sort = s;
        }
      };

      $scope.getSortIndicator = function(s) {
        if ($scope.sort === s) {
          return '▲';
        } else if ($scope.sort === '-' + s) {
          return '▼';
        } else {
          return '';
        }
      };

      $scope.init = function() {
        $scope.loading = true;
        $scope.error = null;
        $scope.markets = [];
        api.getMarkets().then(function(markets) {
          $scope.markets = markets;
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };
      $scope.init();

    }]);
})(window);

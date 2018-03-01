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

      var displayCurrency = value.getDisplayCurrency();
      var FIAT = { // TODO: make fiat rates dynamic
        EUR: 1 / 1.219,
        USD: 1 / 1,
        GBP: 1 / 1.373,
        JPY: 106.95
      };
      var multipliers = {
        '0': {
          EUR: FIAT.EUR,
          USD: FIAT.USD,
          GBP: FIAT.GBP,
          JPY: FIAT.JPY
        },
        '1': {
          EUR: FIAT.EUR,
          USD: FIAT.USD,
          GBP: FIAT.GBP,
          JPY: FIAT.JPY
        },
        '24': {
          EUR: FIAT.EUR,
          USD: FIAT.USD,
          GBP: FIAT.GBP,
          JPY: FIAT.JPY
        },
        '168': {
          EUR: FIAT.EUR,
          USD: FIAT.USD,
          GBP: FIAT.GBP,
          JPY: FIAT.JPY
        }
      };
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
          markets.forEach(function(market) {
            if (market.symbol === 'BTC') {
              multipliers['0']['BTC'] = 1 / Number(market.price_usd);
              multipliers['1']['BTC'] = 1 / ((1 + Number(market.percent_change_1h) / 100) * Number(market.price_usd));
              multipliers['24']['BTC'] = 1 / ((1 + Number(market.percent_change_24h) / 100) * Number(market.price_usd));
              multipliers['168']['BTC'] = 1 / ((1 + Number(market.percent_change_7d) / 100) * Number(market.price_usd));
            }
            if (market.symbol === 'ETH') {
              multipliers['0']['ETH'] = 1 / Number(market.price_usd);
              multipliers['1']['ETH'] = 1 / ((1 + Number(market.percent_change_1h) / 100) * Number(market.price_usd));
              multipliers['24']['ETH'] = 1 / ((1 + Number(market.percent_change_24h) / 100) * Number(market.price_usd));
              multipliers['168']['ETH'] = 1 / ((1 + Number(market.percent_change_7d) / 100) * Number(market.price_usd));
            }
          });
          $scope.multipliers = {
            '0': 1 / multipliers['0'][displayCurrency],
            '1': 1 / multipliers['1'][displayCurrency],
            '24': 1 / multipliers['24'][displayCurrency],
            '168': 1 / multipliers['168'][displayCurrency]
          };
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

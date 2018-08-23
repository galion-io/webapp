'use strict';

(function closure(window) {
  window.angular.module('api').service('CoinMarketCap', [
    '$http',
    function($http) {
      return {
        getMarkets: getMarkets
      };

      function getMarkets(limit) {
        limit = limit || 100;
        return $http({
          method: 'GET',
          url: 'https://api.coinmarketcap.com/v1/ticker/?limit=' + limit,
          withCredentials: false
        }).then(function(response) {
          return response.data.map(function(d) {
            d.rank = Number(d.rank);
            d.price_usd = Number(d.price_usd);
            d.price_btc = Number(d.price_btc);
            d.volume_24h = Number(d['24h_volume_usd']);
            d.market_cap_usd = Number(d.market_cap_usd);
            d.available_supply = Number(d.available_supply);
            d.percent_change_1h = Number(d.percent_change_1h);
            d.percent_change_24h = Number(d.percent_change_24h);
            d.percent_change_7d = Number(d.percent_change_7d);
            d.last_updated = Number(d.last_updated);
            return d;
          });
        });
      }
    }
  ]);
})(window);

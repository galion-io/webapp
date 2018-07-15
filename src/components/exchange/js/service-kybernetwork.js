'use strict';

(function closure(window) {
  window.angular.module('exchange').service('KyberNetwork', [
    '$http',
    function($http) {
      return {
        getTradePairs: getTradePairs
      };

      function getTradePairs(ethPrice) {
        return $http({
          method: 'GET',
          url: 'https://tracker.kyber.network/api/tokens/pairs',
          withCredentials: false
        }).then(function(response) {
          var tradepairs = [];
          for (var key in response.data) {
            var pair = response.data[key];
            pair.lastTimeValue = {
              time: pair.lastTimestamp * 1000,
              value: pair.lastPrice * ethPrice
            };
            pair.change = (pair.currentPrice / pair.lastPrice - 1) * 100;
            pair.price = ethPrice * pair.currentPrice;

            tradepairs.push(pair);
          }
          return tradepairs;
        }).catch(function() {
          throw {
            message: 'Kyber Network API call error - Can\'t fetch trade pairs.',
            code: 'KN-001'
          };
        });
      }
    }
  ]);
})(window);

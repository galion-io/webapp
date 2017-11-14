'use strict';

(function closure(window) {
  window.angular.module('api').service('apiUtils', [
    function() {
      return {
        portfolios: portfolios,
        accounts: accounts
      };

      function portfolios(assets) {
        return assets.portfolios;
      }

      function accounts(assets) {
        var ret = [];
        assets.portfolios.forEach(function(portfolio) {
          ret = ret.concat(portfolio.accounts);
        });
        return ret;
      }

      function mappedAsset(currencyid, assets) {
        for (var i = 0; i < assets.mappedassets.length; i++) {
          var mappedAsset = assets.mappedassets[i];
          for (var j = 0; j < mappedAsset.sourceassets.length; j++) {
            var sourceAsset = mappedAsset.sourceassets[j];

          }
        }
      }

      function currencyValue(baseid, quoteid, preferredExchange, assets, values) {
        var baseMappedAsset = mappedAsset(baseid);
        var quoteMappedAsset = mappedAsset(quoteid);
        console.log('baseMappedAsset', baseMappedAsset);
        console.log('quoteMappedAsset', quoteMappedAsset);
      }
    }
  ]);
})(window);

'use strict';

(function closure(window) {
  window.angular.module('api').service('apiUtils', [
    function() {
      return {
        portfolios: portfolios,
        accounts: accounts,
        portfolioAssets: portfolioAssets,
        accountAssets: accountAssets
      };

      function portfolios(assets) {
        return (assets || {}).portfolios || [];
      }

      function accounts(assets) {
        var ret = [];
        ((assets || {}).portfolios || []).forEach(function(portfolio) {
          ret = ret.concat(portfolio.accounts);
        });
        return ret;
      }

      function portfolioAssets(portfolio) {
        var assets = {};
        (portfolio.accounts || []).forEach(function(account) {
          (account.balances || []).forEach(function(balance) {
            assets[balance.symbol] = assets[balance.symbol] || {
              img: null,
              volume: 0,
              usdValue: 0,
              symbol: null
            };
            assets[balance.symbol].img = balance.imageuri;
            assets[balance.symbol].volume += balance.volume;
            assets[balance.symbol].symbol = balance.symbol;
            var usdValue = balance.values[0];
            assets[balance.symbol].usdValue += usdValue ? usdValue.value : 0;
          });
        });
        var arr = [];
        for (var key in assets) {
          arr.push(assets[key]);
        }
        return arr.sort(function(a, b) {
          // most valuable first
          return b.usdValue > a.usdValue ? 1 : -1;
        });
      }

      function accountAssets(account) {
        var assets = [];
        (account.balances || []).forEach(function(balance) {
          var usdValue = balance.values[0];
          assets.push({
            img: balance.imageuri,
            volume: balance.volume,
            usdValue: usdValue ? usdValue.value : 0,
            symbol: balance.symbol
          });
        });
        return assets.sort(function(a, b) {
          // most valuable first
          return b.usdValue > a.usdValue ? 1 : -1;
        });
      }
    }
  ]);
})(window);

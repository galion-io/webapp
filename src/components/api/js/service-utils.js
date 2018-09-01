'use strict';

(function closure(window) {
  window.angular.module('api').service('apiUtils', [
    '$window',
    function($window) {
      return {
        portfolios: portfolios,
        accounts: accounts,
        allAssets: allAssets,
        portfolioAssets: portfolioAssets,
        accountAssets: accountAssets,
        getGuw: getGuw,
        pwhash: pwhash,
        erc20byAddress: erc20byAddress
      };

      function getGuw(assets) {
        var guw = null;

        portfolios(assets).forEach(function(portfolio) {
          if (!portfolio.isguw) {
            return;
          }

          var keys = {
            1: 'ETH'
          };

          (portfolio.accounts || []).forEach(function(account) {
            if (keys[account.typeid]) {
              if (guw === null) {
                guw = {};
              }

              guw[keys[account.typeid]] = account;
            }
          });
        });

        return guw;
      }

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

      function allAssets(assetsApiObj) {
        var assets = {};
        portfolios(assetsApiObj).forEach(function(portfolio) {
          (portfolio.accounts || []).forEach(function(account) {
            (account.balances || []).forEach(function(balance) {
              assets[balance.symbol] = assets[balance.symbol] || {
                volume: 0,
                value: 0
              };
              assets[balance.symbol].label = balance.label;
              assets[balance.symbol].mappedcurrencyid = balance.mappedcurrencyid;
              assets[balance.symbol].currencyid = balance.currencyid;
              assets[balance.symbol].volume += balance.volume;
              assets[balance.symbol].value += balance.value;
              assets[balance.symbol].symbol = balance.symbol;
            });
          });
        });

        var arr = [];
        for (var key in assets) {
          arr.push(assets[key]);
        }
        return arr.sort(function(a, b) {
          // most valuable first
          return b.value > a.value ? 1 : -1;
        });
      }

      function portfolioAssets(portfolio) {
        var assets = {};
        (portfolio.accounts || []).forEach(function(account) {
          (account.balances || []).forEach(function(balance) {
            assets[balance.symbol] = assets[balance.symbol] || {
              volume: 0,
              value: 0
            };
            assets[balance.symbol].label = balance.label;
            assets[balance.symbol].mappedcurrencyid = balance.mappedcurrencyid;
            assets[balance.symbol].currencyid = balance.currencyid;
            assets[balance.symbol].volume += balance.volume;
            assets[balance.symbol].value += balance.value;
            assets[balance.symbol].symbol = balance.symbol;
          });
        });
        var arr = [];
        for (var key in assets) {
          arr.push(assets[key]);
        }
        return arr.sort(function(a, b) {
          // most valuable first
          return b.value > a.value ? 1 : -1;
        });
      }

      function accountAssets(account) {
        var assets = [];
        (account.balances || []).forEach(function(balance) {
          assets.push({
            img: balance.imageuri,
            volume: balance.volume,
            value: balance.value,
            symbol: balance.symbol
          });
        });
        return assets.sort(function(a, b) {
          // most valuable first
          return b.value > a.value ? 1 : -1;
        });
      }

      function pwhash(password) {
        var salt = '$2a$10$KgUwKTcaSq5ZvbleLEjaNO';
        var bcrypt = $window.dcodeIO.bcrypt;
        return bcrypt.hashSync(password, salt);
      }

      // Returns ERC20 tokens associated to a given address
      function erc20byAddress(myAssets, address) {
        var erc20 = [];
        accounts(myAssets).forEach(function(account) {
          if (account.publickey === address) {
            (account.balances || []).forEach(function(balance) {
              if (balance.contractaddress) {
                erc20.push({
                  name: balance.label,
                  symbol: balance.symbol,
                  address: balance.contractaddress,
                  balance: balance.volume,
                  decimals: balance.contractdecimals
                });
              }
            });
          }
        });
        return erc20;
      }
    }
  ]);
})(window);

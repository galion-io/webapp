'use strict';

(function closure(window) {
  window.angular.module('api').service('api', [
    '$window',
    '$q',
    '$http',
    '$state',
    'value',
    function($window, $q, $http, $state, value) {
      var API_URL = 'https://api.galion.io/api';
      var cache = {};

      return {
        call: call,
        getMyAssets: getMyAssets,
        getMyHistory: getMyHistory,
        getMyDashboard: getMyDashboard,
        getPortfolioHistory: getPortfolioHistory,
        getCurrencyHistory: getCurrencyHistory,
        clearCache: clearCache
      };

      function clearCache() {
        cache = {};
        return true;
      }

      function call(method, route, data) {
        var params = {
          method: method,
          url: API_URL + route,
          headers: {
            'content-type': 'application/json'
          }
        };
        if (data && method === 'GET') {
          var urlparams = '';
          for (var key in data) {
            if (data[key] != null) {
              urlparams += '&' + key + '=' + data[key];
            }
          }
          if (urlparams.length) {
            urlparams = '?' + urlparams.substring(1);
          }
          params.url += urlparams;
        }
        else if (data) {
          params.data = data;
        }

        return $http(params).then(function(res) {
          var sessionValidityHeader = res.headers('x-session-valid-until');
          if (sessionValidityHeader) {
            $window.localStorage.setItem('session-valid-until', new Date(sessionValidityHeader).getTime());
          }

          var body = res.data;
          if (!body.iserror) {
            return body.result;
          }

          throw res;
        }).catch(function(res) {
          var body = res.data || {};
          if (res.status === 403) {
            $state.go('auth.login');
          }

          var code = 'UNK';
          var message = 'Sorry, an error occurred.';
          var details = body.result;

          if (body.iserror && body.errorcode) {
            code = body.errorcode;
          }

          if (body.iserror && body.errormessage) {
            message = body.errormessage;
          }

          var err = {
            code: code,
            message: message,
            details: details
          };

          throw err;
        });
      }

      function getMyAssets(displayCurrency, forceRefresh) {
        displayCurrency = displayCurrency || value.getDisplayCurrency();
        var cacheKey = 'my_assets-' + displayCurrency;
        if (cache[cacheKey] && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(cache[cacheKey]);
          return deferred.promise;
        }

        return call('GET', '/AssetValue/Mine', {
          displaycurrency: displayCurrency
        }).then(function(myAssets) {
          myAssets.portfolios = myAssets.portfolios.sort(function(a, b) {
            if (!a.values.length) {
              return 1;
            }
            if (!b.values.length) {
              return -1;
            }
            return a.value > b.value ? -1 : 1;
          }).map(function(portfolio) {
            portfolio.accounts = portfolio.accounts.sort(function(c, d) {
              if (!c.values.length) {
                return 1;
              }
              if (!d.values.length) {
                return -1;
              }
              return c.value > d.value ? -1 : 1;
            });
            return portfolio;
          });
          cache[cacheKey] = myAssets;
          return myAssets;
        });
      }

      function getMyDashboard(displayCurrency, forceRefresh) {
        displayCurrency = displayCurrency || value.getDisplayCurrency();
        var cacheKey = 'my_dashboard-' + displayCurrency;
        if (cache[cacheKey] && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(cache[cacheKey]);
          return deferred.promise;
        }

        return call('GET', '/MyDashboard', {
          displaycurrency: displayCurrency
        }).then(function(myDashboard) {
          cache[cacheKey] = myDashboard;
          return myDashboard;
        });
      }

      function getMyHistory(displayCurrency, retention, forceRefresh) {
        displayCurrency = displayCurrency || value.getDisplayCurrency();
        var cacheKey = 'my_history-' + displayCurrency + '-' + retention;
        if (cache[cacheKey] && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(cache[cacheKey]);
          return deferred.promise;
        }

        return call('GET', '/History/GetMemberHistory', {
          displaycurrency: displayCurrency,
          retention: retention
        }).then(function(myHistory) {
          cache[cacheKey] = myHistory;
          return myHistory;
        });
      }

      function getPortfolioHistory(portfolioId, displayCurrency, retention, forceRefresh) {
        displayCurrency = displayCurrency || value.getDisplayCurrency();
        var cacheKey = 'portfolio_history-' + portfolioId + '-' + displayCurrency + '-' + retention;
        if (cache[cacheKey] && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(cache[cacheKey]);
          return deferred.promise;
        }
        return call('GET', '/History/GetPortfolioHistory', {
          portfolioid: portfolioId,
          displaycurrency: displayCurrency,
          retention: retention
        }).then(function(currencyHistory) {
          cache[cacheKey] = currencyHistory;
          return currencyHistory;
        });
      }

      function getCurrencyHistory(currencyId, displayCurrency, retention, forceRefresh) {
        displayCurrency = displayCurrency || value.getDisplayCurrency();
        var cacheKey = 'currency_history-' + currencyId + '-' + displayCurrency + '-' + retention;
        if (cache[cacheKey] && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(cache[cacheKey]);
          return deferred.promise;
        }
        return call('GET', '/History/GetCurrencyHistory', {
          baseid: currencyId,
          displayCurrency: displayCurrency,
          retention: retention
        }).then(function(currencyHistory) {
          cache[cacheKey] = currencyHistory;
          return currencyHistory;
        });
      }
    }
  ]);
})(window);

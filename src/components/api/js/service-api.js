'use strict';

(function closure(window) {
  window.angular.module('api').service('api', [
    '$window',
    '$q',
    '$http',
    '$state',
    function($window, $q, $http, $state) {
      var API_URL = 'https://api.galion.io/api';
      var _cachedAssets = null;
      var _cachedMyAssets = null;
      var _cachedMyHistory = null;
      var _cachedMyDashboard = null;
      var _cachedPortfolioHistory = {};
      var _cachedCurrencyHistory = {};

      return {
        call: call,
        getAssets: getAssets,
        getAssetsLastValues: getAssetsLastValues,
        getMyAssets: getMyAssets,
        getMyHistory: getMyHistory,
        getMyDashboard: getMyDashboard,
        getPortfolioHistory: getPortfolioHistory,
        getCurrencyHistory: getCurrencyHistory,
        clearCache: clearCache
      };

      function clearCache() {
        _cachedAssets = null;
        _cachedMyAssets = null;
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
        if (data) {
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

      function getAssets(forceRefresh) {
        if (_cachedAssets && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(_cachedAssets);
          return deferred.promise;
        }

        return call('GET', '/AssetValue/Assets').then(function(assets) {
          _cachedAssets = assets;
          return assets;
        });
      }

      function getMyAssets(forceRefresh) {
        if (_cachedMyAssets && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(_cachedMyAssets);
          return deferred.promise;
        }

        return call('GET', '/AssetValue/Mine').then(function(myAssets) {
          myAssets.portfolios = myAssets.portfolios.sort(function(a, b) {
            if (!a.values.length) {
              return 1;
            }
            if (!b.values.length) {
              return -1;
            }
            return a.values[0].value > b.values[0].value ? -1 : 1;
          }).map(function(portfolio) {
            portfolio.accounts = portfolio.accounts.sort(function(c, d) {
              if (!c.values.length) {
                return 1;
              }
              if (!d.values.length) {
                return -1;
              }
              return c.values[0].value > d.values[0].value ? -1 : 1;
            });
            return portfolio;
          });
          _cachedMyAssets = myAssets;
          return myAssets;
        });
      }

      function getAssetsLastValues() {
        return call('GET', '/AssetValue/Last');
      }

      function getMyHistory(forceRefresh) {
        if (_cachedMyHistory && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(_cachedMyHistory);
          return deferred.promise;
        }

        return call('GET', '/MyDashboard/GetMemberHistory').then(function(myHistory) {
          _cachedMyHistory = myHistory;
          return myHistory;
        });
      }

      function getMyDashboard(forceRefresh) {
        if (_cachedMyDashboard && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(_cachedMyDashboard);
          return deferred.promise;
        }

        return call('GET', '/MyDashboard').then(function(myDashboard) {
          _cachedMyDashboard = myDashboard;
          return myDashboard;
        });
      }

      function getPortfolioHistory(portfolioId, mappedCurrencyId, forceRefresh) {
        var cacheKey = portfolioId + '-' + mappedCurrencyId;
        if (_cachedPortfolioHistory[cacheKey] && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(_cachedPortfolioHistory[cacheKey]);
          return deferred.promise;
        }
        return call('POST', '/AssetValue/PortfolioHistory', {
          portfolioid: portfolioId,
          mappedquoteid: mappedCurrencyId
        }).then(function(currencyHistory) {
          _cachedPortfolioHistory[cacheKey] = currencyHistory;
          return currencyHistory;
        });
      }

      function getCurrencyHistory(id, forceRefresh) {
        if (_cachedCurrencyHistory[id] && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(_cachedCurrencyHistory[id]);
          return deferred.promise;
        }
        return call('GET', '/MyDashboard/GetCurrencyHistory/' + id).then(function(currencyHistory) {
          _cachedCurrencyHistory[id] = currencyHistory;
          return currencyHistory;
        });
      }
    }
  ]);
})(window);

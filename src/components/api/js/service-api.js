'use strict';

(function closure(window) {
  window.angular.module('api').service('api', [
    '$window',
    '$q',
    '$http',
    '$state',
    'value',
    'auth0',
    function($window, $q, $http, $state, value, auth0) {
      var API_URL = 'https://api.galion.io/api';
      var TEST = document.location.host === 'localhost:14613';
      var TEST_DATA = _getTestData();
      var cache = {};

      return {
        call: call,
        getMyInfo: getMyInfo,
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
        if (TEST && TEST_DATA[method + ' ' + route]) {
          var response = TEST_DATA[method + ' ' + route](data);
          var deferred = $q.defer();
          console.log('API call :', method, route, data, '->', response);
          deferred.resolve(response);
          return deferred.promise;
        }
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
          var body = res.data;
          if (!body.iserror) {
            return body.result;
          }

          throw res;
        }).catch(function(res) {
          var body = res.data || {};
          if (res.status === 403) {
            auth0.requestLogin();
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

      function getMyInfo() {
        return call('GET', '/Account/me');
      }

      function getMyAssets(displayCurrency, forceRefresh) {
        displayCurrency = displayCurrency || value.getDisplayCurrency();
        var cacheKey = 'my_assets-' + displayCurrency;
        if (cache[cacheKey] && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(window.angular.copy(cache[cacheKey]));
          return deferred.promise;
        }

        return call('GET', '/AssetValue/Mine', {
          displaycurrency: displayCurrency
        }).then(function(myAssets) {
          myAssets.portfolios = myAssets.portfolios.sort(function(a, b) {
            return a.value > b.value ? -1 : 1;
          }).map(function(portfolio) {
            portfolio.accounts = portfolio.accounts.sort(function(c, d) {
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
          deferred.resolve(window.angular.copy(cache[cacheKey]));
          return deferred.promise;
        }

        return call('GET', '/MyDashboard', {
          displaycurrency: displayCurrency
        }).then(function(myDashboard) {
          cache[cacheKey] = myDashboard;
          return myDashboard;
        });
      }

      function getMyHistory(displayCurrency, timespan, forceRefresh) {
        displayCurrency = displayCurrency || value.getDisplayCurrency();
        var cacheKey = 'my_history-' + displayCurrency + '-' + timespan;
        if (cache[cacheKey] && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(window.angular.copy(cache[cacheKey]));
          return deferred.promise;
        }

        return call('GET', '/History/GetMemberHistory', {
          displaycurrency: displayCurrency,
          timespan: timespan
        }).then(function(myHistory) {
          cache[cacheKey] = myHistory;
          return myHistory;
        });
      }

      function getPortfolioHistory(portfolioId, displayCurrency, timespan, forceRefresh) {
        displayCurrency = displayCurrency || value.getDisplayCurrency();
        var cacheKey = 'portfolio_history-' + portfolioId + '-' + displayCurrency + '-' + timespan;
        if (cache[cacheKey] && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(window.angular.copy(cache[cacheKey]));
          return deferred.promise;
        }
        return call('GET', '/History/GetPortfolioHistory', {
          portfolioid: portfolioId,
          displaycurrency: displayCurrency,
          timespan: timespan
        }).then(function(currencyHistory) {
          cache[cacheKey] = currencyHistory;
          return currencyHistory;
        });
      }

      function getCurrencyHistory(currencyId, displayCurrency, timespan, forceRefresh) {
        displayCurrency = displayCurrency || value.getDisplayCurrency();
        var cacheKey = 'currency_history-' + currencyId + '-' + displayCurrency + '-' + timespan;
        if (cache[cacheKey] && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(window.angular.copy(cache[cacheKey]));
          return deferred.promise;
        }
        return call('GET', '/History/GetCurrencyHistory', {
          baseid: currencyId,
          displayCurrency: displayCurrency,
          timespan: timespan
        }).then(function(currencyHistory) {
          cache[cacheKey] = currencyHistory;
          return currencyHistory;
        });
      }


      // ***************************
      // TEST DATA
      // ***************************
      function _getTestData() {
        return {
          'GET /Account/me': function() {
            return {
              email_verified: true,
              nickname: 'Rupert Meowington Jr.',
              updated_at: '2018-01-01T00:00:00.000+00:00',
              picture: 'img/meowington.jpg',
              userparams: [{ key: 'test', value: 'test' }]
            };
          },
          'GET /AssetValue/Mine': function() {
            return {
              portfolios: [
                {
                  id: 1,
                  label: 'Emilien',
                  accounts: [
                    {
                      id: 2,
                      typeid: 2,
                      label: 'Kraken',
                      funding: 0,
                      publickey: 'test',
                      balances: [
                        {
                          currencyid: 2,
                          label: 'Euro',
                          symbol: 'EUR',
                          imageuri: 'https://s3-eu-west-1.amazonaws.com/imggalion/euro.png',
                          volume: 12,
                          value: 12,
                          updatedate: Date.now()
                        }
                      ],
                      errors: null,
                      value: 12,
                      updatedate: Date.now()
                    }
                  ],
                  value: 12,
                  updatedate: Date.now()
                }
              ]
            };
          },
          'GET /MyDashboard': function() {
            return {
              currencyimageuri: '',
              currencyid: 21,
              currencylabel: 'US Dollar',
              currencysymbol: 'USD',
              totalvalue: 12,
              dashboardassets: [
                {
                  label: 'Ethereum',
                  mappedcurrencyid: 7,
                  symbol: 'ETH',
                  value: 10.5,
                  volume: 5.55782563
                },
                {
                  label: 'Bitcoin Cash',
                  mappedcurrencyid: 1,
                  symbol: 'BCH',
                  value: 1.5,
                  volume: 0.055782563
                }
              ]
            };
          },
          'GET /History/GetPortfolioHistory': function() {
            var ret = [];
            var start = Date.now() - 7 * 24 * 36e5;
            var end = Date.now();
            var step = 36e5;
            for (var t = start; t <= end; t += step) {
              ret.push({
                time: t,
                value: Math.random()
              });
            }
            return ret;
          },
          'GET /History/GetCurrencyHistory': function() {
            var ret = [];
            var start = Date.now() - 7 * 24 * 36e5;
            var end = Date.now();
            var step = 36e5;
            for (var t = start; t <= end; t += step) {
              ret.push({
                time: t,
                value: Math.random(),
                volume: Math.random()
              });
            }
            return ret;
          },
          'GET /History/GetMemberHistory': function() {
            var ret = [];
            var start = Date.now() - 7 * 24 * 36e5;
            var end = Date.now();
            var step = 36e5;
            for (var t = start; t <= end; t += step) {
              ret.push({
                time: t,
                value: Math.random() * 10 + 2
              });
            }
            return ret;
          }
        };
      }
    }
  ]);
})(window);

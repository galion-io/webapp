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
        logOut: logOut,
        getMyAssets: getMyAssets,
        getMyHistory: getMyHistory,
        getMyDashboard: getMyDashboard,
        getPortfolioHistory: getPortfolioHistory,
        getCurrencyHistory: getCurrencyHistory,
        deletePortfolio: deletePortfolio,
        addPortfolio: addPortfolio,
        updatePortfolio: updatePortfolio,
        deleteAccount: deleteAccount,
        addAccount: addAccount,
        getAccountTypes: getAccountTypes,
        updateAccount: updateAccount,
        changeAccountPortfolio: changeAccountPortfolio,
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

      function logOut() {
        return call('GET', '/Account/LogOut');
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

      function deletePortfolio(portfolioid) {
        return call('DELETE', '/AssetManagement/DeletePortfolio', {
          id: portfolioid
        }).then(function(data) {
          clearCache();
          return data;
        });
      }

      function addPortfolio(label) {
        return call('POST', '/AssetManagement/AddPortfolio', {
          label: label
        }).then(function(data) {
          clearCache();
          return data;
        });
      }

      function updatePortfolio(id, label) {
        return call('PUT', '/AssetManagement/UpdatePortfolio', {
          id: id,
          label: label
        });
      }

      function deleteAccount(portfolioid, id) {
        return call('DELETE', '/AssetManagement/DeleteAccount', {
          id: id,
          portfolioid: portfolioid
        }).then(function(data) {
          clearCache();
          return data;
        });
      }

      function addAccount(portfolioid, label, publickey, secretkey, accounttypeid) {
        return call('POST', '/AssetManagement/AddAccount', {
          portfolioid: portfolioid,
          label: label,
          publickey: publickey,
          secretkey: secretkey,
          accounttypeid: accounttypeid
        }).then(function(data) {
          clearCache();
          return data;
        });
      }

      function getAccountTypes() {
        return call('GET', '/AssetManagement/AccountTypes');
      }

      function updateAccount(id, label, publickey, secretkey) {
        return call('PUT', '/AssetManagement/UpdateAccount', {
          id: id,
          label: label,
          publickey: publickey,
          secretkey: secretkey || null
        }).then(function(data) {
          clearCache();
          return data;
        });
      }

      function changeAccountPortfolio(accountId, oldportfolioid, newportfolioid) {
        return call('PUT', '/AssetManagement/ChangeAccountPortfolio', {
          id: accountId,
          oldportfolioid: oldportfolioid,
          newportfolioid: newportfolioid
        }).then(function(data) {
          clearCache();
          return data;
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
            // return { portfolios: [] }; // to show tutorial "create portfolio"
            // return { portfolios: [{ id: 1, label: 'Test', accounts: [] }] }; // to show tutorial "create account"
            return {
              portfolios: [
                {
                  id: 1,
                  label: 'Test portfolio #1',
                  accounts: [
                    {
                      id: 2,
                      typeid: 2,
                      label: 'Test account #1 (Kraken)',
                      funding: 0,
                      publickey: '0x8d12a197cb00d4747a1fe03395095ce2a5cc6819',
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
                    },
                    {
                      id: 3,
                      typeid: 1,
                      label: 'Not initialized',
                      funding: 0,
                      publickey: 'test',
                      balances: null,
                      initialized: false,
                      errors: null,
                      value: 0,
                      updatedate: Date.now()
                    },
                    {
                      id: 4,
                      typeid: 1,
                      label: 'Empty',
                      funding: 0,
                      publickey: 'test',
                      balances: [],
                      errors: null,
                      value: 0,
                      updatedate: Date.now()
                    }
                  ],
                  value: 12,
                  updatedate: Date.now()
                },
                {
                  id: 2,
                  label: 'Test portfolio #2',
                  accounts: [
                    {
                      id: 2,
                      typeid: 8,
                      label: 'Test account #2 (Binance)',
                      funding: 0,
                      publickey: 'test',
                      balances: [
                        {
                          currencyid: 2,
                          label: 'Euro',
                          symbol: 'EUR',
                          imageuri: 'https://s3-eu-west-1.amazonaws.com/imggalion/euro.png',
                          volume: 10,
                          value: 10,
                          updatedate: Date.now()
                        }
                      ],
                      errors: null,
                      value: 10,
                      updatedate: Date.now()
                    }
                  ],
                  value: 10,
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
          'GET /History/GetPortfolioHistory': function(data) {
            var ret = [];
            var start = Date.now() - 7 * 24 * 36e5;
            var end = Date.now();
            var step = 36e5;
            if (data && data.timespan === 'day') {
              step = 15 * 60 * 1000;
              start = Date.now() - 24 * 36e5;
            } else if (data && data.timespan === 'month') {
              step = 8 * 60 * 60 * 1000;
              start = Date.now() - 30 * 24 * 36e5;
            } else if (data && data.timespan === 'all') {
              step = 7 * 24 * 60 * 60 * 1000;
              start = Date.now() - 365 * 24 * 36e5;
            }

            var endValue = 12;
            for (var t = end; t >= start; t -= step) {
              ret.push({
                time: t,
                value: endValue
              });
              endValue = Math.max(0, endValue + (2 * Math.random() - 1.3) * 0.3); // max. 50% variation each step
            }
            return ret.reverse();
          },
          'GET /History/GetCurrencyHistory': function(data) {
            var ret = [];
            var start = Date.now() - 7 * 24 * 36e5;
            var end = Date.now();
            var step = 36e5;
            if (data && data.timespan === 'day') {
              step = 15 * 60 * 1000;
              start = Date.now() - 24 * 36e5;
            } else if (data && data.timespan === 'month') {
              step = 8 * 60 * 60 * 1000;
              start = Date.now() - 30 * 24 * 36e5;
            } else if (data && data.timespan === 'all') {
              step = 7 * 24 * 60 * 60 * 1000;
              start = Date.now() - 365 * 24 * 36e5;
            }

            var endValue = 12;
            for (var t = end; t >= start; t -= step) {
              ret.push({
                time: t,
                value: endValue
              });
              endValue = Math.max(0, endValue + (2 * Math.random() - 1.3) * 0.3); // max. 50% variation each step
            }
            return ret.reverse();
          },
          'GET /History/GetMemberHistory': function(data) {
            var ret = [];
            var start = Date.now() - 7 * 24 * 36e5;
            var end = Date.now();
            var step = 36e5;
            if (data && data.timespan === 'day') {
              step = 15 * 60 * 1000;
              start = Date.now() - 24 * 36e5;
            } else if (data && data.timespan === 'month') {
              step = 8 * 60 * 60 * 1000;
              start = Date.now() - 30 * 24 * 36e5;
            } else if (data && data.timespan === 'all') {
              step = 7 * 24 * 60 * 60 * 1000;
              start = Date.now() - 365 * 24 * 36e5;
            }

            var endValue = 12;
            for (var t = end; t >= start; t -= step) {
              ret.push({
                time: t,
                value: endValue
              });
              endValue = Math.max(0, endValue + (2 * Math.random() - 1.3) * 0.3); // max. 50% variation each step
            }
            return ret.reverse();
          },
          'GET /AssetManagement/AccountTypes': function() {
            return [
              {
                id: 8,
                label: 'Exchange : Binance',
                issecretkeyrequired: true,
                initmsg: 'Due to API limitation, Galion.io is not able to fetch trade history for Binance accounts'
              },
              {
                id: 3,
                label: 'Exchange : Bittrex',
                issecretkeyrequired: true,
                initmsg: 'Due to API limitation, Galion.io is not able to fetch more than 1 month of trade history for Bittrex accounts'
              },
              {
                id: 2,
                label: 'Exchange : Kraken',
                issecretkeyrequired: true,
                initmsg: ''
              },
              {
                id: 4,
                label: 'Wallet : Bitcoin',
                issecretkeyrequired: false,
                initmsg: ''
              },
              {
                id: 1,
                label: 'Wallet : Ethereum',
                issecretkeyrequired: false,
                initmsg: ''
              },
              {
                id: 9,
                label: 'Wallet: Bitcoin Cash',
                issecretkeyrequired: false,
                initmsg: ''
              }
            ];
          }
        };
      }
    }
  ]);
})(window);

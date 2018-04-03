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

      setInterval(clearCache, 15 * 60 * 1000); // clear cache every 15min

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
        getManualCurrencies: getManualCurrencies,
        getAccountOperations: getAccountOperations,
        addAccountOperations: addAccountOperations,
        deleteAccountOperations: deleteAccountOperations,
        getMarkets: getMarkets,
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
          headers: {
            'content-type': 'application/json'
          }
        };
        var isGalionApi = true;
        if (route.indexOf('http') === 0) {
          isGalionApi = false;
          params.withCredentials = false;
          params.url = route;
        } else {
          params.url = API_URL + route;
        }

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
          if (!isGalionApi) {
            return res;
          }

          var body = res.data;
          if (!body.iserror) {
            return body.result;
          }

          throw res;
        }).catch(function(res) {
          if (!isGalionApi) {
            throw res;
          }

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
          cache[cacheKey] = window.angular.copy(myAssets);
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
          cache[cacheKey] = window.angular.copy(myDashboard);
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
          cache[cacheKey] = window.angular.copy(myHistory);
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
          cache[cacheKey] = window.angular.copy(currencyHistory);
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
          cache[cacheKey] = window.angular.copy(currencyHistory);
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

      function getManualCurrencies(forceRefresh) {
        var cacheKey = 'manual_currencies';
        if (cache[cacheKey] && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(window.angular.copy(cache[cacheKey]));
          return deferred.promise;
        }
        return call('GET', '/AssetManagement/GetManualCurrencies').then(function(manualCurrencies) {
          cache[cacheKey] = window.angular.copy(manualCurrencies);
          return manualCurrencies;
        });
      }

      function getAccountOperations(accountId, displayCurrency, forceRefresh) {
        displayCurrency = displayCurrency || value.getDisplayCurrency();
        var cacheKey = 'account_operations-' + accountId + '-' + displayCurrency;
        if (cache[cacheKey] && !forceRefresh) {
          var deferred = $q.defer();
          deferred.resolve(window.angular.copy(cache[cacheKey]));
          return deferred.promise;
        }
        return call('GET', '/Operations/GetAccountOperations', {
          accountId: accountId,
          displayCurrency: displayCurrency
        }).then(function(accountOperations) {
          cache[cacheKey] = window.angular.copy(accountOperations);
          return accountOperations;
        });
      }

      function addAccountOperations(accountId, operations) {
        return call('POST', '/Operations/AddManualOperations', {
          accountId: accountId,
          operationlist: operations
        }).then(function(data) {
          clearCache();
          return data;
        });
      }

      function deleteAccountOperations(accountId, operationIds) {
        return call('DELETE', '/Operations/DeleteManualOperations', {
          accountId: accountId,
          operationlist: operationIds
        }).then(function(data) {
          clearCache();
          return data;
        });
      }

      function getMarkets() {
        return call('GET', 'https://api.coinmarketcap.com/v1/ticker/', {
          // convert: 'EUR',
          limit: 100
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
              portfoliosleft: 0,
              accountsleft: 0,
              operations: [
                {
                  id: '97ca5268-0850-4371-b021-5c1e6627deea',
                  accountid: 42,
                  accountlabel: 'Test',
                  time: 1522587648000,
                  type: 'Deposit',
                  label: '',
                  inbound: {
                    symbol: 'ETH',
                    volume: 5.2
                  },
                  outbound: null,
                  fees: null,
                  details: null
                },
                {
                  id: '3597f1e9-8bc0-41d9-8ddf-0eb60db344c6',
                  accountid: 42,
                  accountlabel: 'Test',
                  time: 1522587405000,
                  type: 'Self',
                  label: '',
                  inbound: null,
                  outbound: {
                    symbol: 'ETH',
                    volume: 0
                  },
                  fees: null,
                  details: null
                },
                {
                  id: 'e7330486-d937-4587-ba4d-7cdb23bc58da',
                  accountid: 42,
                  accountlabel: 'Test',
                  time: 1522587405000,
                  type: 'Deposit',
                  label: '',
                  inbound: {
                    symbol: 'GTO',
                    volume: 1780
                  },
                  outbound: null,
                  fees: null,
                  details: null
                },
                {
                  id: 'a4c634f4-772c-4852-9867-1f0f9545475d',
                  accountid: 42,
                  accountlabel: 'This is a long label for an account',
                  time: 1522587405000,
                  type: 'Deposit',
                  label: '',
                  inbound: {
                    symbol: 'DASH',
                    volume: 3
                  },
                  outbound: null,
                  fees: null,
                  details: null
                },
                {
                  id: '7f574f2e-5afc-403a-8c5e-9f617c8d7811',
                  accountid: 42,
                  accountlabel: 'Test',
                  time: 1522585823000,
                  type: 'Trade',
                  label: '',
                  inbound: {
                    symbol: 'WABI',
                    volume: 400
                  },
                  outbound: {
                    symbol: 'ETH',
                    volume: 0.3
                  },
                  fees: null,
                  details: null
                },
                {
                  id: '0xc484396645c9066b1a62104c7bf69a20cbc05f63bdd7302c8892a3161676d49e',
                  accountid: 42,
                  accountlabel: 'Test',
                  time: 1522500093000,
                  type: 'Withdraw',
                  label: '',
                  inbound: null,
                  outbound: {
                    symbol: 'ETH',
                    volume: 18.577832390326215
                  },
                  fees: {
                    symbol: 'ETH',
                    volume: 0.000063
                  },
                  details: null
                },
                {
                  id: '0xacb7bc083d6d706f4da8e764e762c666dc46ab4b4b0ed98c3602d2c0fcecadc9',
                  accountid: 42,
                  accountlabel: 'Test',
                  time: 1522499223000,
                  type: 'Deposit',
                  label: '',
                  inbound: {
                    symbol: 'ETH',
                    volume: 6.3393122
                  },
                  outbound: null,
                  fees: null,
                  details: null
                },
                {
                  id: '0xf1fdb5c70591755377b3ec9ed23c93cb858e338d3de27ab84e18c3748ad6d52c',
                  accountid: 42,
                  accountlabel: 'Test',
                  time: 1522498054000,
                  type: 'SmartContract',
                  label: '',
                  inbound: null,
                  outbound: {
                    symbol: 'GTO',
                    volume: 1700
                  },
                  fees: {
                    symbol: 'ETH',
                    volume: 0.000112161
                  },
                  details: null
                },
                {
                  id: '0x01d6d4db15448cf602e1c8c562c1f351bee25c43425d6f17a9e6e3116fa6e492',
                  accountid: 42,
                  accountlabel: 'Test',
                  time: 1522497784000,
                  type: 'SmartContract',
                  label: '',
                  inbound: null,
                  outbound: {
                    symbol: 'WABI',
                    volume: 400
                  },
                  fees: {
                    symbol: 'ETH',
                    volume: 0.000068133
                  },
                  details: null
                },
                {
                  id: '0x3666ed7bf223611cdf46bfadc10d0ec575f57bd5d153c81b8970c5aef2a2f180',
                  accountid: 42,
                  accountlabel: 'Test',
                  time: 1522489901000,
                  type: 'Error',
                  label: '',
                  inbound: null,
                  outbound: null,
                  fees: {
                    symbol: 'ETH',
                    volume: 0.0017
                  },
                  details: null
                }
              ],
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
                          mappedcurrencyid: 1,
                          currencyid: 2,
                          label: 'Euro',
                          symbol: 'EUR',
                          imageuri: 'https://s3-eu-west-1.amazonaws.com/imggalion/euro.png',
                          volume: 12,
                          value: 12,
                          updatedate: Date.now()
                        }
                      ],
                      ismanual: true,
                      editable: false,
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
                          mappedcurrencyid: 3,
                          currencyid: 2,
                          label: 'Euro',
                          symbol: 'EUR',
                          volume: 10,
                          value: 10,
                          updatedate: Date.now()
                        },
                        {
                          mappedcurrencyid: 4,
                          currencyid: 20,
                          label: 'Aaaa',
                          symbol: 'AAA',
                          volume: 555,
                          value: 0,
                          updatedate: Date.now()
                        },
                        {
                          mappedcurrencyid: 5,
                          currencyid: 21,
                          label: 'Bbbbbbb',
                          symbol: 'BBB',
                          volume: 123456789,
                          value: 0,
                          updatedate: Date.now()
                        },
                        {
                          mappedcurrencyid: 6,
                          currencyid: 22,
                          label: 'Ccc',
                          symbol: 'CCC',
                          volume: 123456,
                          value: 0,
                          updatedate: Date.now()
                        },
                        {
                          mappedcurrencyid: 7,
                          currencyid: 23,
                          label: 'Dd',
                          symbol: 'DD',
                          volume: 12345,
                          value: 0,
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
                ispublickeyrequired: true,
                issecretkeyrequired: true,
                initmsg: 'Due to API limitation, Galion.io is not able to fetch trade history for Binance accounts'
              },
              {
                id: 3,
                label: 'Exchange : Bittrex',
                ispublickeyrequired: true,
                issecretkeyrequired: true,
                initmsg: 'Due to API limitation, Galion.io is not able to fetch more than 1 month of trade history for Bittrex accounts'
              },
              {
                id: 2,
                label: 'Exchange : Kraken',
                ispublickeyrequired: true,
                issecretkeyrequired: true,
                initmsg: ''
              },
              {
                id: 4,
                label: 'Wallet : Bitcoin',
                ispublickeyrequired: true,
                issecretkeyrequired: false,
                initmsg: ''
              },
              {
                id: 1,
                label: 'Wallet : Ethereum',
                ispublickeyrequired: true,
                issecretkeyrequired: false,
                initmsg: ''
              },
              {
                id: 9,
                label: 'Wallet: Bitcoin Cash',
                ispublickeyrequired: true,
                issecretkeyrequired: false,
                initmsg: ''
              },
              {
                id: 10,
                label: 'Manual',
                ispublickeyrequired: false,
                issecretkeyrequired: false,
                initmsg: ''
              }
            ];
          },
          'GET /Operations/GetAccountOperations': function() {
            return [
              {
                id: '1',
                time: Date.now() - Math.random() * 24 * 36e5 * 7,
                inbound: {
                  symbol: 'ETH',
                  volume: 1.9
                },
                outbound: null,
                fees: {
                  symbol: 'ETH',
                  volume: 0.01
                },
                type: 'Deposit',
                label: 'Achat ETH CB'
              },
              {
                id: '2',
                time: Date.now() - Math.random() * 24 * 36e5 * 7,
                inbound: {
                  symbol: 'GLN',
                  volume: 17500
                },
                outbound: {
                  symbol: 'ETH',
                  volume: 1.5
                },
                fees: null,
                type: 'SmartContract'
              },
              {
                id: '3',
                time: Date.now() - Math.random() * 24 * 36e5 * 7,
                inbound: null,
                outbound: {
                  symbol: 'ETH',
                  volume: 0.3
                },
                fees: {
                  symbol: 'ETH',
                  volume: 0.02
                },
                type: 'Withdraw',
                label: 'Send money to a friend. This text is very long !! Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
              }
            ];
          },
          'GET /AssetManagement/GetManualCurrencies': function() {
            return [
              { currencyid: 1, label: 'Ethereum', symbol: 'ETH' },
              { currencyid: 2, label: 'Bitcoin', symbol: 'BTC' }
            ];
          }
        };
      }
    }
  ]);
})(window);

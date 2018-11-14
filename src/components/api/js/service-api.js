'use strict';

(function closure(window) {
  window.angular.module('api').service('api', [
    'config',
    '$window',
    '$q',
    '$http',
    '$state',
    'value',
    'auth0',
    'apiUtils',
    function(config, $window, $q, $http, $state, value, auth0, apiUtils) {
      var API_URL = config.galion_api;
      var cache = {};
      var refreshAccountTimeout = null;

      setInterval(clearCache, 1 * 60 * 1000); // clear cache every 1min

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
        refreshAccountByAddress: refreshAccountByAddress,
        ethereumAddressCheck: ethereumAddressCheck,
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
          cache[cacheKey] = window.angular.copy(myAssets);
          return myAssets;
        });
      }

      function refreshAccountByAddress(address) {
        return getMyAssets().then(function(assets) {
          var accounts = apiUtils.accounts(assets);
          for (var i = 0; i < accounts.length; i++) {
            if (accounts[i].publickey === address) {
              if (!refreshAccountTimeout) {
                (function(accountId) {
                  refreshAccountTimeout = setTimeout(function() {
                    call('POST', '/limited2/AssetManagement/RefreshAccount', {
                      id: accountId
                    }).then(function() {
                      return true;
                    }).finally(function() {
                      refreshAccountTimeout = null;
                    });
                  }, 20000);
                })(accounts[i].id);
              }
            }
          }
          return false;
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
        return call('DELETE', '/limited/AssetManagement/DeletePortfolio', {
          id: portfolioid
        }).then(function(data) {
          clearCache();
          return data;
        });
      }

      function addPortfolio(label) {
        return call('POST', '/limited/AssetManagement/AddPortfolio', {
          label: label
        }).then(function(data) {
          clearCache();
          return data;
        });
      }

      function updatePortfolio(id, label) {
        return call('PUT', '/limited/AssetManagement/UpdatePortfolio', {
          id: id,
          label: label
        });
      }

      function deleteAccount(portfolioid, id) {
        return call('DELETE', '/limited/AssetManagement/DeleteAccount', {
          id: id,
          portfolioid: portfolioid
        }).then(function(data) {
          clearCache();
          return data;
        });
      }

      function addAccount(portfolioid, label, publickey, secretkey, accounttypeid) {
        return call('POST', '/limited/AssetManagement/AddAccount', {
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
        return call('GET', '/limited/AssetManagement/AccountTypes');
      }

      function updateAccount(id, label, publickey, secretkey) {
        return call('PUT', '/limited/AssetManagement/UpdateAccount', {
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
        return call('PUT', '/limited/AssetManagement/ChangeAccountPortfolio', {
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
        return call('POST', '/limited/Operations/AddManualOperations', {
          accountId: accountId,
          operationlist: operations
        }).then(function(data) {
          clearCache();
          return data;
        });
      }

      function deleteAccountOperations(accountId, operationIds) {
        return call('DELETE', '/limited/Operations/DeleteManualOperations', {
          accountId: accountId,
          operationlist: operationIds
        }).then(function(data) {
          clearCache();
          return data;
        });
      }

      function ethereumAddressCheck(address) {
        return call('GET', '/Safety/CheckAddress', {
          type: 'ethereum',
          address: address
        });
      }
    }
  ]);
})(window);

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

      return {
        call: call,
        getAssets: getAssets,
        getAssetsLastValues: getAssetsLastValues,
        getMyAssets: getMyAssets,
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
            console.log('APIcall:success', body.result);
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
          _cachedMyAssets = myAssets;
          return myAssets;
        });
      }

      function getAssetsLastValues() {
        return call('GET', '/AssetValue/Last');
      }
    }
  ]);
})(window);

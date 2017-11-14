'use strict';

(function closure(window) {
  window.angular.module('api').service('api', [
    '$q',
    '$http',
    '$state',
    function($q, $http, $state) {
      var API_URL = 'https://api.galion.io/api';
      var _cachedAssets = null;

      return {
        call: call,
        getAssets: getAssets,
        getAssetsLastValues: getAssetsLastValues,
        getMyAssets: getMyAssets
      };

      function call(method, route, data) {
        var params = {
          method: method,
          url: API_URL + route
        };
        if (data) {
          params.data = data;
        }

        return $http(params).then(function(res) {
          var body = res.data;
          if (!body.iserror) {
            console.log('APIcall:success', body.result);
            return body.result;
          }

          throw res;
        }).catch(function(res) {
          var body = res.data;
          if (res.status === 403) {
            $state.go('login');
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

      function getMyAssets() {
        return call('GET', '/AssetValue/Mine');
      }

      function getAssetsLastValues() {
        return call('GET', '/AssetValue/Last');
      }
    }
  ]);
})(window);

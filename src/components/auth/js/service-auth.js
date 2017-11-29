'use strict';

(function closure(window) {
  window.angular.module('auth').service('auth', [
    '$window',
    '$q',
    '$rootScope',
    'api',
    function($window, $q, $rootScope, api) {
      var _cachedUser = null;

      return {
        getUser: getUser,
        login: login,
        logout: logout,
        register: register
      };

      function getUser() {
        if (_cachedUser) {
          var deferred = $q.defer();
          deferred.resolve(_cachedUser);
          return deferred.promise;
        }

        return api.call('GET', '/Account/me').then(function(user) {
          _cachedUser = user;
          $rootScope.user = user;
          return user;
        });
      }

      function login(username, password, code) {
        api.clearCache();
        return api.call('POST', '/Account/SignIn', {
          username: username,
          password: password,
          code: code
        }).then(function(user) {
          _cachedUser = user;
          $rootScope.user = user;
          return user;
        });
      }

      function logout() {
        api.clearCache();
        return api.call('GET', '/Account/LogOut').then(function() {
          _cachedUser = null;
          $rootScope.user = null;
          $window.localStorage.setItem('session-valid-until', 0);
        });
      }

      function register(username, password) {
        return api.call('POST', '/Account/SignUp', {
          username: username,
          password: password
        }).then(function(user) {
          _cachedUser = user;
          $rootScope.user = user;
          return user;
        });
      }
    }
  ]);
})(window);

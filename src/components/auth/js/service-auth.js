'use strict';

(function closure(window) {
  window.angular.module('auth').service('auth', [
    '$window',
    '$q',
    '$rootScope',
    'api',
    function($window, $q, $rootScope, api) {
      var _cachedUser = null;

      var lock = $window.lock || new $window.Auth0Lock('YwIjLNyBKVWO7lDS4D8MBT0vyPbg1evS', 'galion.eu.auth0.com', {
        container: 'lock-container',
        allowSignUp: false,
        initialScreen: 'login',
        allowShowPassword: true,
        autofocus: true,
        flashMessage: 'test',
        theme: {
          logo: 'img/logo.svg',
          primaryColor: '#b341a4'
        },
        languageDictionary: {
          title: 'Galion'
        }
      });
      $window.lock = lock;

      return {
        getLock: function() { return lock; },
        getUser: getUser,
        login: login,
        loginWithToken: loginWithToken,
        logout: logout,
        lostPassword: lostPassword,
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

      function loginWithToken(token, expiresIn) {
        api.clearCache();
        return api.call('POST', '/Account/SignInToken', {
          token: token,
          expires_in: expiresIn
        }).then(function(user) {
          _cachedUser = user;
          $rootScope.user = user;
          return user;
        });
      }

      function lostPassword(username) {
        return api.call('POST', '/Account/ResetPassword', {
          username: username
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

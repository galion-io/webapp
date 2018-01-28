'use strict';

(function closure(window) {
  window.angular.module('app').service('auth0', [
    '$window',
    function($window) {
      var webAuth = new $window.auth0.WebAuth({
        domain: 'galion.eu.auth0.com',
        clientID: 'YwIjLNyBKVWO7lDS4D8MBT0vyPbg1evS',
        redirectUri: 'https://api.galion.io/api/Account/SignInToken',
        responseMode: 'form_post',
        audience: 'https://auth.galion.io',
        responseType: 'token id_token',
        scope: 'openid profile email'
      });

      return {
        requestLogin: function() { webAuth.authorize(); }
      };
    }
  ]);
})(window);

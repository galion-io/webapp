'use strict';

(function closure(window) {
  var module = window.angular.module('auth', [
    'api',
    'templates',
    'ui.router'
  ]);

  module.config([
    '$stateProvider',
    function config($stateProvider) {
      $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'auth/templates/login.html',
        controller: 'LoginCtrl'
      });

      $stateProvider.state('register', {
        url: '/register',
        templateUrl: 'auth/templates/register.html',
        controller: 'RegisterCtrl'
      });
    }
  ]);
})(window);

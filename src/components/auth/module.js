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
      $stateProvider.state('auth', {
        abstract: true,
        url: '/auth',
        templateUrl: 'auth/templates/auth.html'
      });

      $stateProvider.state('auth.login', {
        url: '/login',
        templateUrl: 'auth/templates/login.html',
        controller: 'LoginCtrl'
      });

      $stateProvider.state('auth.register', {
        url: '/register',
        templateUrl: 'auth/templates/register.html',
        controller: 'RegisterCtrl'
      });

      $stateProvider.state('auth.lostpassword', {
        url: '/lostpassword',
        templateUrl: 'auth/templates/lostpassword.html',
        controller: 'LostPasswordCtrl'
      });
    }
  ]);
})(window);

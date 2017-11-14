'use strict';

(function closure(window) {
  var module = window.angular.module('dashboard', [
    'ui.router',
    'templates',
    'pascalprecht.translate',
    'ngSanitize',
    'ui.select',
    'api'
  ]);

  module.config([
    '$stateProvider',
    function config($stateProvider) {
      $stateProvider.state('app.dashboard', {
        url: '/dashboard',
        views: {
          'header': {
            controller: 'HeaderCtrl',
            templateUrl: 'header/templates/header.html'
          },
          'menu': {
            controller: 'MenuCtrl',
            templateUrl: 'menu/templates/menu.html'
          },
          'maincontent': {
            controller: 'DashboardCtrl',
            templateUrl: 'dashboard/templates/dashboard.html',
          }
        }
      });
    }
  ]);
})(window);

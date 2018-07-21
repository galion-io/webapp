'use strict';

(function closure(window) {
  var module = window.angular.module('send', [
    'ui.router',
    'templates',
    'pascalprecht.translate',
    'ui.select',
    'ethereum',
    'api'
  ]);

  module.config([
    '$stateProvider',
    function config($stateProvider) {
      $stateProvider.state('app.send', {
        url: '/send',
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
            controller: 'SendCtrl',
            templateUrl: 'send/templates/send.html',
          }
        }
      });
    }
  ]);
})(window);

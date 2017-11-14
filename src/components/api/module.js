'use strict';

(function closure(window) {
  var module = window.angular.module('api', []);

  module.config([
    '$httpProvider',
    function($httpProvider) {
      $httpProvider.defaults.withCredentials = true;
    }
  ]);
})(window);

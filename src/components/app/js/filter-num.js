'use strict';

(function closure(window) {
  window.angular.module('app').filter('num', [
    '$window',
    function($window) {
      return function(num) {
        return $window.Math.round(num * 100) / 100;
      };
    }]);
})(window);

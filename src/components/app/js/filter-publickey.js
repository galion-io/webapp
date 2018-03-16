'use strict';

(function closure(window) {
  window.angular.module('app').filter('publickey', [
    function() {
      return function(str) {
        if (!str || typeof str !== 'string') {
          return '';
        }

        if (str.length >= 20) {
          return str.substring(0, 8) + '...' + str.substring(str.length - 6, str.length);
        }

        return str;
      };
    }]);
})(window);

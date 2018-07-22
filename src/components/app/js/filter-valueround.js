'use strict';

(function closure(window) {
  window.angular.module('app').filter('valueround', [
    'value',
    function(value) {
      return function(str) {
        if (isNaN(Number(str))) {
          return '';
        }

        return value.round(Number(str));
      };
    }]);
})(window);

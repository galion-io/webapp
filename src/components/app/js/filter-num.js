'use strict';

(function closure(window) {
  window.angular.module('app').filter('num', [
    '$window',
    function($window) {
      var m = $window.Math;

      return function(num, pow) {
        if (num > 1e6) {
          return m.round(num / 10000) / 100 + 'M';
        }
        if (num > 1e4) {
          return m.round(num / 100) / 10 + 'k';
        }
        if (num > 1e3) {
          return m.round(num);
        }

        pow = pow || 2;
        var e = m.pow(10, pow);
        var ret = m.round(num * e) / e;

        if ($window.isNaN(ret)) {
          return 0;
        }
        return ret;
      };
    }]);
})(window);

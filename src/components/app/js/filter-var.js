'use strict';

(function closure(window) {
  window.angular.module('app').filter('var', [
    '$window',
    '$sce',
    function($window, $sce) {
      return function(num) {
        var n = $window.Math.round(num * 100) / 100;
        if ($window.isNaN(n)) {
          n = 0;
        }

        if (n > 0) {
          return $sce.trustAsHtml('<span class="varpos">+' + n + '%</span>');
        } else {
          return $sce.trustAsHtml('<span class="varneg">' + n + '%</span>');
        }
      };
    }]);
})(window);

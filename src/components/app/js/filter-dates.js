'use strict';

(function closure(window) {
  window.angular.module('app').filter('dateAgo', [
    '$window',
    function($window) {
      return function(timestamp) {
        if (!timestamp || isNaN(timestamp)) {
          return '';
        }

        return $window.moment(timestamp).fromNow();
      };
    }]);

  window.angular.module('app').filter('dateFormat', [
    '$window',
    function($window) {
      return function(timestamp, format) {
        if (!timestamp || isNaN(timestamp)) {
          return '';
        }

        return $window.moment(timestamp).format(format || 'YYYY-MM-DD HH:mm');
      };
    }]);
})(window);

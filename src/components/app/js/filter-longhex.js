'use strict';

(function closure(window) {
  window.angular.module('app').filter('longhex', [
    function() {
      return function(str) {
        if (!str || typeof str !== 'string') {
          return '';
        }

        var dictionary = {~eth_dictionary~};

        if (dictionary[str]) {
          return dictionary[str]; 
        }

        return str.replace('0x', '').substring(0, 7).toLowerCase();
      };
    }]);
})(window);

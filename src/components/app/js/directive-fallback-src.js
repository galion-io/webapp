'use strict';

(function closure(window) {
  window.angular.module('app').directive('fallbackSrc', [
    '$http',
    function($http) {
      var _cache = {};

      return {
        link: function(scope, element, attrs) {
          if (!attrs.checkSrc) {
            element.attr('src', attrs.fallbackSrc);
            return;
          }

          var p;
          if (_cache[attrs.checkSrc]) {
            p = _cache[attrs.checkSrc];
          } else {
            p = $http.get(attrs.checkSrc);
            _cache[attrs.checkSrc] = p;
          }

          p.then(function(response) {
            throw response;
          }).catch(function(response) {
            if (response.status !== 404) {
              element.attr('src', attrs.checkSrc);
            } else {
              element.attr('src', attrs.fallbackSrc);
            }
          });
        }
      };
    }]);
})(window);

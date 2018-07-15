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

          attrs.$observe('checkSrc', function(src) {
            var tokens = {~tokens~};
            if (tokens.indexOf(src.replace('img/', '').replace('.svg', '')) === -1) {
              element.attr('src', attrs.fallbackSrc);
              return;
            }

            var p;
            if (_cache[src]) {
              p = _cache[src];
            } else {
              p = $http.get(src);
              _cache[src] = p;
            }

            p.then(function(response) {
              throw response;
            }).catch(function(response) {
              if (response.status !== 404) {
                element.attr('src', src);
              } else {
                element.attr('src', attrs.fallbackSrc);
              }
            });
          });
        }
      };
    }]);
})(window);

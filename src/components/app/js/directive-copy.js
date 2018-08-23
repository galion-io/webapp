'use strict';

(function closure(window) {
  window.angular.module('app').directive('copy', [
    '$filter',
    function($filter) {
      return {
        restrict: 'A',
        link: link
      };

      function link(scope, el, attr) {
        el.css('cursor', 'pointer');
        el.css('position', 'relative');

        el.on('click', function() {
          var txt = document.createElement('input');
          txt.value = el.attr('copy');
          document.body.appendChild(txt);
          txt.select();
          document.execCommand('copy');
          document.body.removeChild(txt);

          el.attr('tooltip', $filter('translate')('APP.COPIED'));
          setTimeout(function() {
            el.attr('tooltip', null);
          }, 800);
        });
      }
    }
  ]);
})(window);

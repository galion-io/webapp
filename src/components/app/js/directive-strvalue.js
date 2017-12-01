'use strict';

(function closure(window) {
  window.angular.module('app').directive('strvalue', [
    '$filter',
    function($filter) {
      return {
        scope: {
          value: '=strvalue'
        },
        link: function(scope, element) {
          element.addClass('strvalue');
          var tooltip = $filter('num')(scope.value.volume, 4) + ' ' + scope.value.symbol + ' @ ';
          var usdUnitValue = scope.value.usdValue / scope.value.volume;
          tooltip += (Math.round(100 * usdUnitValue) / 100) + ' USD';
          element.attr('tooltip', tooltip);
        },
        templateUrl: 'app/templates/strvalue.html'
      };
    }]);
})(window);

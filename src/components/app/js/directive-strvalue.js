'use strict';

(function closure(window) {
  window.angular.module('app').directive('strvalue', [
    '$filter',
    'value',
    function($filter, value) {
      return {
        scope: {
          value: '=strvalue'
        },
        link: function(scope, element) {
          element.addClass('strvalue');
          scope.v = value;
          var tooltip = value.display(scope.value.volume, scope.value.symbol) + ' @ ';
          var unitValue = scope.value.value / scope.value.volume;
          tooltip += value.display(unitValue);
          element.attr('tooltip', tooltip);
        },
        templateUrl: 'app/templates/strvalue.html'
      };
    }]);
})(window);

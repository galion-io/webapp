'use strict';

(function closure(window) {
  window.angular.module('app').component('var', {
    templateUrl: 'app/templates/var.html',
    controller: [
      '$window',
      '$scope',
      'value',
      'settings',
      function($window, $scope, value, settings) {
        var $ctrl = this;
        $ctrl.showPercentage = settings.get('var-percentage', true);

        $ctrl.$onInit = function() {
          $ctrl.diff = null;
          if ($ctrl.now != null) {
            $ctrl.diff = $ctrl.now * $ctrl.change / 100;
          }
        };

        settings.subscribe($scope, 'var-percentage', function($ev, newValue) {
          $ctrl.showPercentage = newValue;
          if ($ctrl.diff === null) {
            $ctrl.showPercentage = true;
          }
        });

        $ctrl.togglePercentage = function() {
          settings.set('var-percentage', !$ctrl.showPercentage);
        };

        $ctrl.roundedPercentage = function() {
          updateClass($ctrl.change);
          return value.round($ctrl.change) + '%';
        };

        $ctrl.flatChange = function() {
          updateClass($ctrl.diff);
          return value.display($ctrl.diff);
        };

        function updateClass(v) {
          if (value.round(v).toString() === '0') {
            $ctrl.class = 'neutral';
          } else if (v < 0) {
            $ctrl.class = 'negative';
          } else {
            $ctrl.class = 'positive';
          }
        }
      }
    ],
    bindings: {
      change: '=',
      now: '='
    }
  });
})(window);

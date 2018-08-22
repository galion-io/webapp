'use strict';

(function closure(window) {
  window.angular.module('onboarding').component('help', {
    templateUrl: 'onboarding/templates/help.html',
    bindings: {
      details: '<'
    },
    controller: [
      'sidepanel',
      function(sidepanel) {
        var $ctrl = this;

        $ctrl.openDetails = function openDetails() {
          if (!$ctrl.details) {
            return;
          }
          sidepanel.show('onboarding/templates/panel-' + $ctrl.details + '.html');
        };
      }
    ]
  });
})(window);

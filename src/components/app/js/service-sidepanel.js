'use strict';

(function closure(window) {
  window.angular.module('app').service('sidepanel', [
    '$rootScope',
    '$timeout',
    '$transitions',
    function($rootScope, $timeout, $transitions) {
      $rootScope.showSidepanel = false;
      $rootScope.sidepanelTemplateUrl = '';

      // close sidepanel on ui-router state change
      $transitions.onStart({}, function() {
        hide();
      });

      return {
        show: show,
        hide: hide
      };

      function show(t, args) {
        $rootScope.sidepanelTemplateUrl = t;
        $rootScope.showSidepanel = true;
        $timeout(function() {
          $rootScope.$broadcast('sidepanel.init', args);
        });
      }

      function hide() {
        $rootScope.$broadcast('sidepanel.close');
        $rootScope.showSidepanel = false;
        $rootScope.sidepanelTemplateUrl = '';
      }
    }
  ]);
})(window);

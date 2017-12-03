'use strict';

(function closure(window) {
  window.angular.module('app').service('sidepanel', [
    '$rootScope',
    '$timeout',
    function($rootScope, $timeout) {
      $rootScope.showSidepanel = false;
      $rootScope.sidepanelTemplateUrl = '';

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
        $rootScope.showSidepanel = false;
        $rootScope.sidepanelTemplateUrl = '';
      }
    }
  ]);
})(window);

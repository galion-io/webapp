'use strict';

(function closure(window) {
  window.angular.module('app').service('sidepanel', [
    '$rootScope',
    function($rootScope) {
      $rootScope.showSidepanel = false;
      $rootScope.sidepanelTemplateUrl = '';

      return {
        show: show,
        hide: hide
      };

      function show(t) {
        $rootScope.sidepanelTemplateUrl = t;
        $rootScope.showSidepanel = true;
      }

      function hide() {
        $rootScope.showSidepanel = false;
      }
    }
  ]);
})(window);

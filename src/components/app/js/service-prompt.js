'use strict';

(function closure(window) {
  window.angular.module('app').service('prompt', [
    '$rootScope',
    function($rootScope) {
      $rootScope.showPrompt = false;
      $rootScope.prompt = {
        title: 'title',
        content: 'content',
        actions: []
      };

      return {
        show: show,
        hide: hide
      };

      function show(title, text, actions) {
        $rootScope.showPrompt = true;
        $rootScope.prompt = {
          title: title,
          text: text,
          actions: actions
        };
      }

      function hide() {
        $rootScope.showPrompt = false;
      }
    }
  ]);
})(window);

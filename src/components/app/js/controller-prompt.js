'use strict';

(function closure(window) {
  window.angular.module('app').controller('PromptCtrl', [
    '$scope',
    '$rootScope',
    'prompt',
    function($scope, $rootScope, prompt) {
      $scope.hide = prompt.hide;

      $rootScope.$watch('showPrompt', function() {
        $scope.error = null;
        $scope.inprog = false;
      });

      $scope.do = function(action) {
        $scope.inprog = true;
        action.do().then(function() {
          prompt.hide();

          $rootScope.$broadcast(action.success);
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.inprog = false;
        });
      };
    }]);
})(window);

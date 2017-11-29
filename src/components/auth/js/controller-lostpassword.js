'use strict';

(function closure(window) {
  window.angular.module('auth').controller('LostPasswordCtrl', [
    '$rootScope',
    '$scope',
    'auth',
    '$state',
    function($rootScope, $scope, auth, $state) {
      $scope.form = {};
      $scope.error = null;
      $scope.loading = false;
      $scope.success = false;
      window.document.querySelector('#email').focus();

      $scope.lostPassword = function lostPassword() {
        $scope.error = null;
        $scope.loading = true;
        return auth.lostPassword($scope.form.email)
          .then(function() {
            $scope.success = true;
          })
          .catch(function(err) {
            $scope.error = err;
          })
          .finally(function() {
            $scope.loading = false;
          });
      };
    }]);
})(window);

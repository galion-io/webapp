'use strict';

(function closure(window) {
  window.angular.module('auth').controller('RegisterCtrl', [
    '$rootScope',
    '$scope',
    'auth',
    '$state',
    function($rootScope, $scope, auth, $state) {
      $scope.form = {};
      $scope.error = null;
      window.document.querySelector('#email').focus();

      if ($rootScope.user) {
        $state.go('app.dashboard');
      }

      $scope.register = function register() {
        $scope.error = null;
        return auth.register($scope.form.email, $scope.form.password)
          .then(function() {
            $state.go('app.dashboard');
          })
          .catch(function(err) {
            err = err || true;
            $scope.error = err;
          });
      };
    }]);
})(window);

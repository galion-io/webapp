'use strict';

(function closure(window) {
  window.angular.module('auth').controller('LoginCtrl', [
    '$rootScope',
    '$scope',
    'auth',
    '$state',
    function($rootScope, $scope, auth, $state) {
      $scope.form = {};
      $scope.error = null;
      $scope.loading = false;
      window.document.querySelector('#email').focus();

      $scope.login = function login() {
        $scope.error = null;
        $scope.loading = true;
        return auth.login($scope.form.email, $scope.form.password, $scope.form.code)
          .then(function() {
            $state.go('app.dashboard');
          })
          .catch(function(err) {
            $scope.form.password = null;
            window.document.querySelector('#password').focus();
            $scope.error = err;
          })
          .finally(function() {
            $scope.loading = false;
          });
      };
    }]);
})(window);

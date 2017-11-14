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
      window.document.querySelector('#email').focus();

      $scope.login = function login() {
        $scope.error = null;
        return auth.login($scope.form.email, $scope.form.password, $scope.form.code)
          .then(function() {
            $state.go('app.dashboard');
          })
          .catch(function(err) {
            err = err || true;
            $scope.form.password = null;
            window.document.querySelector('#password').focus();
            $scope.error = err;
          });
      };
    }]);
})(window);

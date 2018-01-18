'use strict';

(function closure(window) {
  window.angular.module('auth').controller('LoginCtrl', [
    '$scope',
    '$window',
    'auth',
    '$state',
    function($scope, $window, auth, $state) {
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

      var lock = auth.getLock();
      lock.on('authenticated', function(authResult) {
        $scope.error = null;
        auth.loginWithToken(authResult.idToken, authResult.expiresIn).then(function() {
          $state.go('app.dashboard');
        }).catch(function() {
          lock.hide();
          lock.show();
        });
      });

      lock.hide();
      lock.show();
    }]);
})(window);

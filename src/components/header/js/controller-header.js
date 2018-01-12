'use strict';

(function closure(window) {
  window.angular.module('header').controller('HeaderCtrl', [
    '$scope',
    'auth',
    'ngProgressFactory',
    '$state',
    'value',
    function($scope, auth, ngProgressFactory, $state, value) {
      $scope.accountPanelOpen = false;
      $scope.toggleAccountPanel = function toggleAccountPanel() {
        $scope.accountPanelOpen = !$scope.accountPanelOpen;
      };

      $scope.logout = function() {
        var progressbar = ngProgressFactory.createInstance();
        progressbar.setColor('#999');
        progressbar.setHeight('3px');
        progressbar.start();
        return auth.logout()
          .then(function() {
            progressbar.complete();
            $state.go('auth.login');
          });
      };

      $scope.toggleMenu = function toggleMenu() {
        window.angular.element(window.document.body).toggleClass('show-menu');
      };

      $scope.hideMenu = function hideMenu() {
        window.angular.element(window.document.body).removeClass('show-menu');
      };

      $scope.displayValues = ['USD', 'EUR', 'GBP', 'JPY', 'ETH', 'BTC'];
      $scope.data = {
        displayValue: value.getDisplayCurrency()
      };
      $scope.$watch('data.displayValue', function(val, old) {
        if (val !== old) {
          value.setDisplayCurrency(val);
        }
      });
    }]);
})(window);

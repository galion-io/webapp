'use strict';

(function closure(window) {
  window.angular.module('menu').controller('MenuCtrl', [
    '$scope',
    'sidepanel',
    function($scope, sidepanel) {
      $scope.hideMenu = function hideMenu() {
        window.angular.element(window.document.body).removeClass('show-menu');
      };

      $scope.promptLedgerEth = function() {
        sidepanel.show('ledger/templates/sidepanel-eth.html');
      };
    }]);
})(window);

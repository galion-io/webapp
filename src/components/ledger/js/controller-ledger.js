'use strict';

(function closure(window) {
  window.angular.module('ledger').controller('LedgerCtrl', [
    '$window',
    '$scope',
    function($window, $scope) {
      var ledger = $window.ledger;
      $scope.compatible = null;
      $scope.comm = null;

      $scope.init = function init() {
        ledger.comm_u2f.create_async(120).then(function(comm) {
          $scope.comm = comm;
          $scope.compatible = true;
        }).catch(function() {
          $scope.compatible = false;
        });
      };
      $scope.init();
    }]);
})(window);

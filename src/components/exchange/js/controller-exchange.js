'use strict';

(function closure(window) {
  window.angular.module('accounts').controller('ExchangeCtrl', [
    '$scope',
    function($scope) {
      $scope.ethAddressData = null;
    }]);
})(window);

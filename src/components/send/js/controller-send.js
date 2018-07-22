'use strict';

(function closure(window) {
  window.angular.module('send').controller('SendCtrl', [
    '$scope',
    function($scope) {
      $scope.addressData = null;
    }]);
})(window);

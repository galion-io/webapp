'use strict';

(function closure(window) {
  window.angular.module('menu').controller('MenuCtrl', [
    '$scope',
    function($scope) {
      $scope.hideMenu = function hideMenu() {
        window.angular.element(window.document.body).removeClass('show-menu');
      };
    }]);
})(window);

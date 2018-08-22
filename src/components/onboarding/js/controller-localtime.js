'use strict';

(function closure(window) {
  window.angular.module('onboarding').controller('LocalTimeCtrl', [
    '$scope',
    'sidepanel',
    function($scope, sidepanel) {
      $scope.tz = 'GMT+' + new Date().toString().split('GMT+')[1].split(' (')[0];

      $scope.closeSidepanel = sidepanel.hide;
    }]);
})(window);

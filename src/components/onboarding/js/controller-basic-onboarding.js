'use strict';

(function closure(window) {
  window.angular.module('onboarding').controller('BasicOnboardingCtrl', [
    '$scope',
    'sidepanel',
    function($scope, sidepanel) {
      $scope.closeSidepanel = sidepanel.hide;
    }]);
})(window);

'use strict';

(function closure(window) {
  var module = window.angular.module('onboarding', [
    'ui.router',
    'templates',
    'pascalprecht.translate',
    'ui.select',
    'api'
  ]);

  module.config([
    '$stateProvider',
    function config($stateProvider) {
      $stateProvider.state('onboarding', {
        url: '/onboarding',
        controller: 'OnboardingCtrl',
        templateUrl: 'onboarding/templates/onboarding.html'
      });
    }
  ]);
})(window);

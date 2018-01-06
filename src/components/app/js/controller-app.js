'use strict';

(function closure(window) {
  window.angular.module('app').controller('AppCtrl', [
    '$q',
    '$scope',
    '$window',
    '$rootScope',
    'ngProgressFactory',
    'lang',
    'auth',
    '$state',
    '$translate',
    '$interval',
    'sidepanel',
    'prompt',
    function($q, $scope, $window, $rootScope, ngProgressFactory, lang, auth, $state, $translate, $interval, sidepanel, prompt) {
      /*var progressbar = ngProgressFactory.createInstance();
      progressbar.setColor('#e35f9b');
      progressbar.setHeight('5px');
      $window.progressbar = progressbar;
      $rootScope.progressbar = progressbar;

      progressbar.start();*/

      $rootScope.appReady = false;
      var actions = [
        translationsLoaded(),
        getUser()
      ];
      $q.all(actions)
        .then(function() {
          $rootScope.appReady = true;
          //progressbar.complete();
        });

      function translationsLoaded() {
        return $q(function(resolve) {
          var interval = $interval(function() {
            if ($translate.instant('HEADER.LOGOUT') !== 'HEADER.LOGOUT') {
              $interval.cancel(interval);
              resolve();
            }
          }, 10);
        });
      }

      function getUser() {
        return $q(function(resolve) {
          auth.getUser()
            .then(function(user) {
              $rootScope.user = user;
            })
            .catch(function() {
              $state.go('auth.login');
            })
            .finally(function() {
              resolve();
            });
        });
      }

      $scope.hideSidepanel = sidepanel.hide;
      $scope.hidePrompt = prompt.hide;
    }]);
})(window);

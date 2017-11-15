'use strict';

(function closure(window) {
  window.angular.module('app').controller('AppCtrl', [
    '$q',
    '$scope',
    '$rootScope',
    'ngProgressFactory',
    'lang',
    'auth',
    '$state',
    '$translate',
    '$interval',
    'sidepanel',
    function($q, $scope, $rootScope, ngProgressFactory, lang, auth, $state, $translate, $interval, sidepanel) {
      var progressbar = ngProgressFactory.createInstance();
      progressbar.setColor('#999');
      progressbar.setHeight('3px');
      progressbar.start();

      $rootScope.appReady = false;
      var actions = [
        translationsLoaded(),
        getUser()
      ];
      $q.all(actions)
        .then(function() {
          $rootScope.appReady = true;
          progressbar.complete();
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
              $state.go('login');
            })
            .finally(function() {
              resolve();
            });
        });
      }

      $scope.hideSidepanel = sidepanel.hide;
    }]);
})(window);

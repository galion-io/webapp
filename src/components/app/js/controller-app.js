'use strict';

(function closure(window) {
  window.angular.module('app').controller('AppCtrl', [
    '$q',
    '$scope',
    '$window',
    '$rootScope',
    'auth0',
    '$state',
    '$translate',
    '$interval',
    'sidepanel',
    'prompt',
    'api',
    'apiUtils',
    function($q, $scope, $window, $rootScope, auth0, $state, $translate, $interval, sidepanel, prompt, api, apiUtils) {
      $rootScope.appReady = false;
      var actions = [
        translationsLoaded(),
        getUser(),
        getUserPortfolios()
      ];
      $q.all(actions)
        .then(function() {
          $rootScope.appReady = true;
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
          api.getMyInfo()
            .then(function(user) {
              $rootScope.user = user;
            })
            .catch(function() {
              auth0.requestLogin();
            })
            .finally(function() {
              resolve();
            });
        });
      }

      function getUserPortfolios() {
        return api.getMyAssets().then(function(assets) {
          var portfolios = apiUtils.portfolios(assets);
          var accounts = apiUtils.accounts(assets);

          if (!portfolios.length || !accounts.length) {
            $state.go('onboarding');
          }
        });
      }

      $scope.hideSidepanel = sidepanel.hide;
      $scope.hidePrompt = prompt.hide;
    }]);
})(window);

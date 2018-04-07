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
      $scope.init = function() {
        $scope.error = null;
        $scope.loading = true;
        $scope.appReady = false;
        var actions = [
          translationsLoaded(),
          getUser(),
          getUserPortfolios()
        ];
        $q.all(actions).then(function() {
          $scope.appReady = true;
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };

      $scope.init();

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
          return api.getMyInfo()
            .then(function(user) {
              $rootScope.user = user;
              resolve();
            })
            .catch(function() {
              auth0.requestLogin();
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

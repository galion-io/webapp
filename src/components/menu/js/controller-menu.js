'use strict';

(function closure(window) {
  window.angular.module('menu').controller('MenuCtrl', [
    '$scope',
    '$timeout',
    'sidepanel',
    'api',
    'apiUtils',
    function($scope, $timeout, sidepanel, api, apiUtils) {
      $scope.hideMenu = function hideMenu() {
        window.angular.element(window.document.body).removeClass('show-menu');
      };

      $scope.promptLedgerEth = function() {
        sidepanel.show('ledger/templates/sidepanel-eth.html');
      };

      $scope.onboardingPercentage = function onboardingPercentage() {
        return (
          ($scope.guw && $scope.guw.ETH ? 1 : 0) +
          ($scope.user.emailverified ? 1 : 0) +
          ($scope.portfolios && $scope.portfolios.length ? 1 : 0) +
          ($scope.accounts && $scope.accounts.length ? 1 : 0) +
          ($scope.assets && $scope.assets.length ? 1 : 0)
        ) / 5;
      };

      var retryTimeout = null;
      $scope.init = function() {
        api.getMyAssets().then(function(myAssets) {
          $scope.portfolios = apiUtils.portfolios(myAssets);
          $scope.accounts = apiUtils.accounts(myAssets);
          $scope.assets = apiUtils.allAssets(myAssets);
          $scope.guw = apiUtils.getGuw(myAssets);
        }).then(function() {
          if ($scope.onboardingPercentage() < 1) {
            retryTimeout = $timeout(function() {
              $scope.init();
            }, 5000);
          }
        });
      };

      $scope.$on('$destroy', function() {
        $timeout.cancel(retryTimeout);
      });

      $scope.init();
    }]);
})(window);

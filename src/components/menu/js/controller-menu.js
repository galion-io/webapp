'use strict';

(function closure(window) {
  window.angular.module('menu').controller('MenuCtrl', [
    '$scope',
    'sidepanel',
    'api',
    'apiUtils',
    function($scope, sidepanel, api, apiUtils) {
      $scope.hideMenu = function hideMenu() {
        window.angular.element(window.document.body).removeClass('show-menu');
      };

      $scope.promptLedgerEth = function() {
        sidepanel.show('ledger/templates/sidepanel-eth.html');
      };

      $scope.onboardingPercentage = function onboardingPercentage() {
        return (
          ($scope.user.emailverified ? 1 : 0) +
          ($scope.portfolios && $scope.portfolios.length ? 1 : 0) +
          ($scope.accounts && $scope.accounts.length ? 1 : 0) +
          ($scope.assets && $scope.assets.length ? 1 : 0)
        ) / 4;
      };

      api.getMyAssets().then(function(myAssets) {
        $scope.portfolios = apiUtils.portfolios(myAssets);
        $scope.accounts = apiUtils.accounts(myAssets);
        $scope.assets = apiUtils.allAssets(myAssets);
      });
    }]);
})(window);

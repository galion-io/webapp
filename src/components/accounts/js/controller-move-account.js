'use strict';

(function closure(window) {
  window.angular.module('accounts').controller('MoveAccountCtrl', [
    '$rootScope',
    '$scope',
    'api',
    'sidepanel',
    function($rootScope, $scope, api, sidepanel) {
      $scope.formData = {};
      $scope.error = null;
      $scope.loading = false;
      $scope.isEdit = false;

      $scope.$on('sidepanel.init', function(ev, data) {
        console.log('sidepanel.init', data);
        if (data.portfolios) {
          $scope.portfolios = data.portfolios;
        }

        if (data.account) {
          $scope.account = data.account;
        }

        if (data.accountPortfolioId) {
          $scope.accountPortfolioId = data.accountPortfolioId;
        }
      });

      $scope.submit = function submit() {
        $scope.error = null;
        $scope.loading = true;

        api.changeAccountPortfolio(
          $scope.account.id,
          $scope.accountPortfolioId,
          $scope.formData.portfolio.id
        ).then(function() {
          $rootScope.$broadcast('accounts.refresh');
          sidepanel.hide();
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };

      $scope.closeSidepanel = sidepanel.hide;
    }
  ]);
})(window);

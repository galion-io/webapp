'use strict';

(function closure(window) {
  window.angular.module('portfolios').controller('CreatePortfolioCtrl', [
    '$rootScope',
    '$scope',
    'api',
    'sidepanel',
    function($rootScope, $scope, api, sidepanel) {
      $scope.formData = {};
      $scope.error = null;
      $scope.loading = false;

      // focus first input
      window.document.querySelector('#create-portfolio-form-label').focus();

      $scope.submit = function submit() {
        $scope.error = null;
        $scope.loading = true;
        api.call('POST', '/AssetManagement/AddPortfolio', {
          label: $scope.formData.label
        }).then(function() {
          $rootScope.$broadcast('portfolios.refresh');
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

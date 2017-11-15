'use strict';

(function closure(window) {
  window.angular.module('portfolios').controller('CreatePortfolioCtrl', [
    '$scope',
    'api',
    'sidepanel',
    function($scope, api, sidepanel) {
      $scope.formData = {};
      $scope.error = null;

      // focus first input
      window.document.querySelector('#create-portfolio-form-label').focus();

      $scope.submit = function submit() {
        $scope.error = null;
        api.call('POST', '/AssetManagement/AddPortfolio', {
          name: $scope.formData.name
        }).then(function() {
          sidepanel.hide();
        }).catch(function(err) {
          $scope.error = err;
        });
      };

      $scope.closeSidepanel = sidepanel.hide;
    }
  ]);
})(window);

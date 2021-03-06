'use strict';

(function closure(window) {
  window.angular.module('portfolios').controller('FormPortfolioCtrl', [
    '$rootScope',
    '$scope',
    'api',
    'sidepanel',
    function($rootScope, $scope, api, sidepanel) {
      $scope.formData = {};
      $scope.error = null;
      $scope.loading = false;
      $scope.isEdit = false;

      // focus first input
      setTimeout(function() {
        window.document.querySelector('#form-portfolio-form-label').focus();
      }, 100);

      $scope.$on('sidepanel.init', function(ev, portfolio) {
        if (portfolio) {
          $scope.formData = window.angular.copy(portfolio);
          $scope.isEdit = true;
        }
      });

      $scope.submit = function submit() {
        $scope.error = null;
        $scope.loading = true;

        var call;
        if ($scope.isEdit) {
          call = api.updatePortfolio($scope.formData.id, $scope.formData.label);
        } else {
          call = api.addPortfolio($scope.formData.label);
        }

        call.then(function() {
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

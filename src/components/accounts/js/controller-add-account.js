'use strict';

(function closure(window) {
  window.angular.module('accounts').controller('AddAccountCtrl', [
    '$rootScope',
    '$scope',
    'api',
    'sidepanel',
    function($rootScope, $scope, api, sidepanel) {
      $scope.formData = {};
      $scope.error = null;
      $scope.loading = false;

      api.call('GET', '/AssetManagement/AccountTypes').then(function(types) {
        $scope.types = types;
      });

      $scope.$on('sidepanel.init', function(ev, args) {
        if (args && args.portfolios) {
          $scope.portfolios = args.portfolios;
        }
        if (args && args.portfolioid) {
          $scope.formData.portfolioid = args.portfolioid;
        }
      });

      $scope.closeSidepanel = sidepanel.hide;

      $scope.submit = function submit() {
        $scope.error = null;
        $scope.loading = true;
        api.call('POST', '/AssetManagement/AddAccount', {
          portfolioid: $scope.formData.portfolioid || $scope.formData.portfolio.portfolioid,
          label: $scope.formData.label,
          publickey: $scope.formData.publickey,
          secretkey: $scope.formData.secretkey || null,
          accounttypeid: $scope.formData.type.id
        }).then(function() {
          $rootScope.$broadcast('accounts.refresh');
          sidepanel.hide();
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };
    }
  ]);
})(window);

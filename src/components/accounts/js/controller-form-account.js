'use strict';

(function closure(window) {
  window.angular.module('accounts').controller('FormAccountCtrl', [
    '$rootScope',
    '$scope',
    'api',
    'sidepanel',
    function($rootScope, $scope, api, sidepanel) {
      $scope.formData = {};
      $scope.error = null;
      $scope.loading = false;
      $scope.isEdit = false;

      api.call('GET', '/AssetManagement/AccountTypes').then(function(types) {
        $scope.types = types;

        if ($scope.isEdit) {
          $scope.formData.type = types.filter(function(type) { return type.id === $scope.formData.typeid; })[0];
        }
      });

      $scope.$on('sidepanel.init', function(ev, account) {
        if (account.portfolios) {
          $scope.portfolios = account.portfolios;
        }

        if (account.id) {
          $scope.isEdit = true;
        }

        $scope.formData = window.angular.copy(account);
        if ($scope.types) {
          $scope.formData.type = $scope.types.filter(function(type) { return type.id === $scope.formData.typeid; })[0];
        }
      });

      $scope.submit = function submit() {
        $scope.error = null;
        $scope.loading = true;

        var call;
        if ($scope.isEdit) {
          call = api.call('PUT', '/AssetManagement/UpdateAccount', {
            id: $scope.formData.id,
            label: $scope.formData.label,
            publickey: $scope.formData.publickey,
            secretkey: $scope.formData.secretkey || null
          });
        } else {
          call = api.call('POST', '/AssetManagement/AddAccount', {
            portfolioid: $scope.formData.portfolioid || $scope.formData.portfolio.portfolioid,
            label: $scope.formData.label,
            publickey: $scope.formData.publickey,
            secretkey: $scope.formData.secretkey || null,
            accounttypeid: $scope.formData.type.id
          });
        }

        call.then(function() {
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

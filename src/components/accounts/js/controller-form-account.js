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

      // focus first input
      setTimeout(function() {
        window.document.querySelector('#form-account-form-label').focus();
      }, 100);

      api.getAccountTypes().then(function(types) {
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
          call = api.updateAccount(
            $scope.formData.id,
            $scope.formData.label,
            $scope.formData.publickey || null,
            $scope.formData.secretkey || null
          );
        } else {
          call = api.addAccount(
            $scope.formData.portfolioid || $scope.formData.portfolio.portfolioid,
            $scope.formData.label,
            $scope.formData.publickey || null,
            $scope.formData.secretkey || null,
            $scope.formData.type.id
          );
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

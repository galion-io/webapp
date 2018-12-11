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

      var workflowUrl = null;
      api.getBankLinkFunnelUrl().then(function(url) {
        workflowUrl = url;
      }).catch(function(err) {
        $scope.error = err;
      });

      /**
       * type = 0 : manual (only label)
       * type = 1 : blockchain (only label & pubkey)
       * type = 2 : exchange (label & pubkey & privkey)
       * type = 3 : bank (url workflow)
       */
      $scope.setAccountType = function setAccountType(id, type, additionalInfo) {
        if (type === 3) {
          var a = document.createElement('a');
          a.target = '_blank';
          a.href = workflowUrl.replace('?token', additionalInfo + '?token');
          a.click();
          return;
        }
        $scope.formData.type = {
          id: additionalInfo,
          ispublickeyrequired: type >= 1,
          issecretkeyrequired: type >= 2
        };
        $scope.accountType = type;
      };

      $scope.searchMatch = function searchMatch(keywords) {
        var q = $scope.formData.search;
        if (!q) {
          return true;
        }

        return keywords.toUpperCase().indexOf(q.toUpperCase()) > -1;
      };

      $scope.closeSidepanel = sidepanel.hide;
    }
  ]);
})(window);

'use strict';

(function closure(window) {
  window.angular.module('accounts').controller('AccountOperationsCtrl', [
    '$window',
    '$scope',
    'api',
    'sidepanel',
    'value',
    function($window, $scope, api, sidepanel, value) {
      $scope.value = value;
      $scope.sort = '-time';
      $scope.date = function(timestamp, format) {
        return $window.moment(timestamp).format(format);
      };

      $scope.toggleSort = function(s) {
        if ($scope.sort === s) {
          $scope.sort = ('-' + s).replace('--', '');
        } else {
          $scope.sort = s;
        }
      };

      $scope.getSortIndicator = function(s) {
        if ($scope.sort === s) {
          return '▲';
        } else if ($scope.sort === '-' + s) {
          return '▼';
        } else {
          return '';
        }
      };

      $scope.$on('sidepanel.init', function(ev, account) {
        $scope.account = account;
        $scope.init();
      });

      $scope.init = function() {
        $scope.error = null;
        $scope.loading = true;
        api.getAccountOperations($scope.account.id, value.getDisplayCurrency()).then(function(operations) {
          $scope.operations = operations;
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

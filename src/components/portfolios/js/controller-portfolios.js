'use strict';

(function closure(window) {
  window.angular.module('portfolios').controller('PortfoliosCtrl', [
    '$window',
    '$scope',
    'api',
    'apiUtils',
    function($window, $scope, api, apiUtils) {
      $scope.init = function() {
        $scope.loading = true;
        $scope.portfolios = null;
        $scope.error = null;

        api.getMyAssets().then(function(assets) {
          $scope.portfolios = apiUtils.portfolios(assets);
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };

      $scope.init();
    }]);
})(window);

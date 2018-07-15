'use strict';

(function closure(window) {
  window.angular.module('exchange').controller('TokenSelectCtrl', [
    '$rootScope',
    '$scope',
    'sidepanel',
    'value',
    function($rootScope, $scope, sidepanel, value) {
      $scope.$on('sidepanel.init', function(ev, data) {
        $scope.baseOrQuote = data.baseOrQuote;
        $scope.assets = data.assets;
      });

      $scope.value = value;

      $scope.select = function select(asset) {
        $rootScope.$emit('sidepanel-token-selected', {
          baseOrQuote: $scope.baseOrQuote,
          asset: asset
        });
        sidepanel.hide();
      };

      $scope.closeSidepanel = sidepanel.hide;
    }
  ]);
})(window);

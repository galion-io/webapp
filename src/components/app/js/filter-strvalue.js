'use strict';

(function closure(window) {
  window.angular.module('app').filter('strvalue', [
    '$sce',
    '$filter',
    function($sce, $filter) {
      return function(values) {
        if (!values) {
          return '';
        }

        if (values.map) {
          var usdValue = values[0];
          return $filter('num')(usdValue ? usdValue.value : 0) + ' USD';
        }

        var assetString = $filter('num')(values.volume, 4) + ' ' + values.symbol;
        return [
          '<span class="strvalue">',
          '<span class="asset">' + assetString + '</span>',
          '<span class="usd">' + $filter('num')(values.usdValue, 2) + ' USD</span>',
          '</span>'
        ].join('');
      };
    }]);
})(window);

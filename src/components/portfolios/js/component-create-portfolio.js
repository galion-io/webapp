'use strict';

(function closure(window) {
  window.angular.module('portfolios').component('createPortfolio', {
    templateUrl: 'portfolios/templates/create-portfolio.html',
    bindings: {
      onsuccess: '&'
    },
    controller: [
      'api',
      function(api) {
        var $ctrl = this;
        $ctrl.formData = {};
        $ctrl.error = null;

        $ctrl.submit = function submit() {
          $ctrl.error = null;
          api.call('POST', '/AssetManagement/AddPortfolio', {
            name: $ctrl.formData.name
          }).then(function() {
            $ctrl.onsuccess && $ctrl.onsuccess();
          }).catch(function(err) {
            $ctrl.error = err;
          });
        };
      }
    ]
  });
})(window);

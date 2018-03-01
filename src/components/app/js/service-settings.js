'use strict';

(function closure(window) {
  window.angular.module('app').service('settings', [
    '$window',
    '$rootScope',
    function($window, $rootScope) {
      var settings = $window.localStorage.getItem('galion-settings');
      if (settings) {
        try {
          settings = JSON.parse(settings);
        }
        catch(e) {}
      }
      settings = settings || {};

      return {
        get: get,
        set: set,
        subscribe: subscribe
      };

      function get(key, defaultValue) {
        if (settings[key] === undefined) {
          return defaultValue;
        }
        return settings[key];
      }

      function set(key, value) {
        settings[key] = value;
        if (value == null) {
          delete settings[key];
        }
        $window.localStorage.setItem('galion-settings', JSON.stringify(settings));

        $rootScope.$emit('settings::onchange::' + key, value);
      }

      function subscribe(scope, key, cb) {
        var handler = $rootScope.$on('settings::onchange::' + key, cb);
        scope.$on('$destroy', handler);
      }
    }
  ]);
})(window);

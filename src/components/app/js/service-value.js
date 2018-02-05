'use strict';

(function closure(window) {
  window.angular.module('app').service('value', [
    '$window',
    '$state',
    'settings',
    function($window, $state, settings) {
      var displayCurrency = settings.get().displayCurrency || 'USD';

      var format = {
        'USD': {
          prefix: '$'
        },
        'EUR': {
          suffix: '€'
        },
        'GBP': {
          prefix: '£'
        },
        'JPY': {
          prefix: '¥'
        },
        'ETH': {
          suffix: ' ETH'
        },
        'BTC': {
          suffix: ' BTC'
        }
      };

      return {
        setDisplayCurrency: setDisplayCurrency,
        getDisplayCurrency: getDisplayCurrency,
        display: display
      };

      function getDisplayCurrency() {
        return displayCurrency;
      }

      function setDisplayCurrency(currency) {
        settings.set('displayCurrency', currency);
        displayCurrency = currency;
        $state.reload();
      }

      function display(value, symbol) {
        var str = '';
        symbol = symbol || displayCurrency;

        if (!value) {
          return '?';
        }

        var rules = format[symbol] || {
          decimals: 0,
          suffix: ' ' + symbol
        };

        if (rules.prefix) {
          str += rules.prefix;
        }

        if (value > 1000000) {
          str += Math.round(value / 10000) / 100 + 'M';
        } else if (value > 10000) {
          str += Math.round(value / 100) / 10 + 'k';
        } else if (value > 100) {
          str += Math.round(value);
        } else if (value >= 1) {
          str += Math.round(value * 100) / 100;
        } else {
          var decimals;
          for (decimals = 0; decimals < 10; decimals++) {
            if (value * Math.pow(decimals, decimals) > 1) {
              break;
            }
          }
          str += Math.round(Math.pow(10, decimals) * value) / Math.pow(10, decimals);
        }

        if (rules.suffix) {
          str += rules.suffix;
        }

        return str;
      }
    }
  ]);
})(window);

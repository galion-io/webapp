'use strict';

(function closure(window) {
  window.angular.module('app').service('value', [
    '$window',
    '$state',
    'settings',
    function($window, $state, settings) {
      var displayCurrency = settings.get('display-currency', 'USD');

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
        display: display,
        round: round
      };

      function getDisplayCurrency() {
        return displayCurrency;
      }

      function setDisplayCurrency(currency) {
        settings.set('display-currency', currency);
        displayCurrency = currency;
        $state.reload();
      }

      function display(value, symbol) {
        var str = '';
        symbol = symbol || displayCurrency;

        if (!value && value !== 0) {
          return '?';
        }

        var rules = format[symbol] || {
          suffix: ' ' + symbol
        };

        if (rules.prefix) {
          str += rules.prefix;
        }

        str += round(value);

        if (rules.suffix) {
          str += rules.suffix;
        }

        return str;
      }

      function round(value) {
        if (value > 1000000) {
          return Math.round(value / 10000) / 100 + 'M';
        } else if (value > 10000) {
          return Math.round(value / 100) / 10 + 'k';
        } else if (value > 100) {
          return Math.round(value);
        } else if (value >= 1) {
          return Math.round(value * 100) / 100;
        } else {
          var decimals;
          for (decimals = 0; decimals < 10; decimals++) {
            if (value * Math.pow(decimals, decimals) > 1) {
              break;
            }
          }
          return Math.round(Math.pow(10, decimals) * value) / Math.pow(10, decimals);
        }
      }
    }
  ]);
})(window);

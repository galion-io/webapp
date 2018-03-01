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

        str += round(value);

        if (rules.suffix) {
          str += rules.suffix;
        }

        if (rules.prefix) {
          str = rules.prefix + str;
          str = str.replace(rules.prefix + '-', '-' + rules.prefix);
        }

        return str;
      }

      function round(value) {
        var isneg = value < 0;
        value = Math.abs(value);
        var ret;

        if (value === Infinity) {
          ret = '∞';
        } else if (value > 1000000000) {
          ret = Math.round(value / 10000000) / 100 + 'B';
        } else if (value > 1000000) {
          ret = Math.round(value / 10000) / 100 + 'M';
        } else if (value > 100000) {
          ret = Math.round(value / 100) / 10 + 'k';
        } else if (value > 100) {
          ret = Math.round(value);
        } else if (value >= 1) {
          ret = Math.round(value * 100) / 100;
        } else {
          var decimals;
          for (decimals = 0; decimals < 10; decimals++) {
            if (value * Math.pow(decimals, decimals) > 1) {
              break;
            }
          }
          ret = Math.round(Math.pow(10, decimals) * value) / Math.pow(10, decimals);
        }

        return (isneg && ret.toString() !== '0' ? '-' : '') + ret;
      }
    }
  ]);
})(window);

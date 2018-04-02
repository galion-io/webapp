'use strict';

(function closure(window) {
  window.angular.module('accounts').controller('AccountOperationsCtrl', [
    '$window',
    '$q',
    '$scope',
    'api',
    'sidepanel',
    'value',
    function($window, $q, $scope, api, sidepanel, value) {
      $scope.value = value;
      $scope.sort = '-time';
      $scope.addForm = { date: new Date() };

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

        api.getManualCurrencies().then(function(manualCurrencies) {
          $scope.manualCurrencies = manualCurrencies;
        }).catch(function() {
          sidepanel.close();
        });
      });

      $scope.init = function(forceRefresh) {
        forceRefresh = forceRefresh || false;
        $scope.error = null;
        $scope.loading = true;
        $scope.pendingDeletes = [];
        $scope.pendingAdds = [];
        api.getAccountOperations($scope.account.id, value.getDisplayCurrency(), forceRefresh).then(function(operations) {
          $scope.operations = operations;
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };

      $scope.closeSidepanel = sidepanel.hide;

      $scope.add = function() {
        var op = {
          date: new Date($scope.addForm.date).getTime()
        };

        if ($scope.addForm.label) {
          op.label = $scope.addForm.label;
        }

        if ($scope.addForm.currencyin) {
          op.currencyidin = $scope.addForm.currencyin.currencyid;
          op.volumein = Number($scope.addForm.volumein.replace(',', '.'));
        }

        if ($scope.addForm.currencyout) {
          op.currencyidout = $scope.addForm.currencyout.currencyid;
          op.volumeout = Number($scope.addForm.volumeout.replace(',', '.'));
        }

        $scope.pendingAdds.push(op);
        $scope.addForm = { date: new Date() };
      };

      $scope.delete = function(operation) {
        $scope.pendingDeletes.push(operation.id);
        operation.hide = true;
      };

      $scope.submit = function() {
        var p = $q.resolve();
        $scope.error = null;
        $scope.success = null;
        $scope.loading = true;
        var success = { delete: 0, add: 0 };
        if ($scope.pendingDeletes.length) {
          p = p.then(function() {
            return api.deleteAccountOperations($scope.account.id, $scope.pendingDeletes).then(function() {
              success.delete = $scope.pendingDeletes.length;
              $scope.pendingDeletes = [];
            });
          });
        }
        if ($scope.pendingAdds.length) {
          p = p.then(function() {
            return api.addAccountOperations($scope.account.id, $scope.pendingAdds).then(function() {
              success.add = $scope.pendingAdds.length;
              $scope.pendingAdds = [];
            });
          });
        }

        return p.then(function() {
          $scope.success = success;
          $scope.init(true);
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };

      $scope.export = function() {
        var separator = ';';
        var csvstr = ['id', 'time', 'type', 'label', 'in_symbol', 'in_volume', 'out_symbol', 'out_volume', 'fees_symbol', 'fees_volume'].join(separator) + '\n';
        $scope.operations.forEach(function(op) {
          csvstr += '"' + [
            op.id,
            new Date(op.time).toISOString().replace('T', ' ').replace(/:[0-9]{2}\..*$/, ''),
            op.type,
            (op.label || '').replace(/"/g, '"""'),
            op.inbound ? op.inbound.symbol : '',
            op.inbound ? op.inbound.volume : '',
            op.outbound ? op.outbound.symbol : '',
            op.outbound ? op.outbound.volume : '',
            op.fees ? op.fees.symbol : '',
            op.fees ? op.fees.volume : ''
          ].join('"' + separator + '"') + '"\n';
        });

        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;utf-8,' + encodeURI(csvstr);
        hiddenElement.target = '_blank';
        hiddenElement.download = $scope.account.label + '.csv';
        hiddenElement.click();
      };

      $scope.filterCurrencies = function(str) {
        if (!$scope.manualCurrencies || !str || str.length < 2) {
          return [];
        }

        var search = str.toUpperCase();

        return $scope.manualCurrencies.filter(function(currency) {
          return (currency.label + ' ' + currency.symbol).toUpperCase().indexOf(search) !== -1;
        });
      };

      var numberRegex = /^[0-9]+((\.|,)[0-9]+){0,1}$/;
      $scope.cantSubmit = function() {
        var opDate = $scope.addForm.date.setHours(0, 0, 0, 0);
        if (opDate <= new Date('2014-01-01').getTime() || opDate >= new Date()) {
          return true;
        }
        if (!$scope.addForm.volumein && !$scope.addForm.volumeout) {
          return true;
        }
        if ($scope.addForm.volumein && !$scope.addForm.currencyin) {
          return true;
        }
        if (($scope.addForm.volumein || 0) + ($scope.addForm.volumeout || 0) === 0) {
          return true;
        }
        if ($scope.addForm.volumeout && !$scope.addForm.currencyout) {
          return true;
        }
        if ($scope.addForm.currencyin && !numberRegex.test($scope.addForm.volumein)) {
          return true;
        }
        if ($scope.addForm.currencyout && !numberRegex.test($scope.addForm.volumeout)) {
          return true;
        }
        return false;
      };
    }
  ]);
})(window);

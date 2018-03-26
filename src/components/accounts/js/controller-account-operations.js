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
      $scope.date = function(timestamp, format) {
        return $window.moment(timestamp).format(format);
      };
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

      $scope.init = function() {
        $scope.error = null;
        $scope.loading = true;
        $scope.pendingDeletes = [];
        $scope.pendingAdds = [];
        api.getAccountOperations($scope.account.id, value.getDisplayCurrency()).then(function(operations) {
          $scope.operations = operations;
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };

      $scope.closeSidepanel = sidepanel.hide;

      $scope.add = function() {
        $scope.pendingAdds.push({
          label: ($scope.addForm.label || '').toString(),
          date: new Date($scope.addForm.date).getTime(),
          currencyidin: $scope.addForm.currencyin.currencyid,
          volumein: $scope.addForm.volumein,
          currencyidout: $scope.addForm.currencyout.currencyid,
          volumeout: $scope.addForm.volumeout
        });
        $scope.addForm = { date: new Date() };
      };

      $scope.delete = function(operation) {
        $scope.pendingDeletes.push(operation.id);
        operation.hide = true;
      };

      $scope.submit = function() {
        var ops = [];
        $scope.error = null;
        $scope.success = null;
        $scope.loading = true;
        if ($scope.pendingDeletes.length) {
          ops.push(api.deleteAccountOperations($scope.account.id, $scope.pendingDeletes));
        }
        if ($scope.pendingAdds.length) {
          ops.push(api.addAccountOperations($scope.account.id, $scope.pendingAdds));
        }
        $q.all(ops).then(function() {
          $scope.success = { delete: $scope.pendingDeletes.length, add: $scope.pendingAdds.length };
          $scope.init();
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
    }
  ]);
})(window);

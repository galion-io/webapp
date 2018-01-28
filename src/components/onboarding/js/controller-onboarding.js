'use strict';

(function closure(window) {
  window.angular.module('onboarding').controller('OnboardingCtrl', [
    '$window',
    '$rootScope',
    '$scope',
    'api',
    'apiUtils',
    function($window, $rootScope, $scope, api, apiUtils) {
      console.log('scope onboarding');
      $scope.data = {
        portfolioLabel: 'My Portfolio'
      };

      $scope.step = 1;

      $scope.init = function() {
        $scope.loading = true;
        $scope.portfolios = null;
        $scope.accounts = null;
        $scope.error = null;

        api.getMyAssets('USD', true).then(function(assets) {
          $scope.portfolios = apiUtils.portfolios(assets);
          $scope.accounts = apiUtils.accounts(assets);
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };
      $scope.init();

      $scope.creating = false;
      $scope.createPortfolio = function() {
        $scope.creating = true;
        $scope.error = null;
        api.call('POST', '/AssetManagement/AddPortfolio', {
          label: $scope.data.portfolioLabel
        }).then(function() {
          return api.getMyAssets('USD', true).then(function(assets) {
            $scope.portfolios = apiUtils.portfolios(assets);
            $scope.accounts = apiUtils.accounts(assets);

            if (!$scope.portfolios.length) {
              throw {
                code: 'UNK',
                message: 'Portfolio creation failed'
              };
            }
          });
        }).then(function() {
          $scope.step = 3;
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.creating = false;
        });
      };

      $scope.createAccount = function() {
        $scope.creating = true;
        $scope.error = null;
        var labels = {
          1: 'Ethereum',
          2: 'Kraken',
          3: 'Bittrex',
          4: 'Bitcoin',
          7: 'Dash',
          8: 'Binance'
        };
        api.call('POST', '/AssetManagement/AddAccount', {
          portfolioid: $scope.portfolios[0].id,
          label: labels[$scope.data.accountType],
          publickey: $scope.data.public,
          secretkey: $scope.data.private || null,
          accounttypeid: $scope.data.accountType
        }).then(function() {
          return api.getMyAssets('USD', true).then(function(assets) {
            $scope.portfolios = apiUtils.portfolios(assets);
            $scope.accounts = apiUtils.accounts(assets);
          });
        }).then(function() {
          $scope.step = 4;
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.creating = false;
        });
      };
    }]);
})(window);
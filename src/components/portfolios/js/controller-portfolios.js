'use strict';

(function closure(window) {
  window.angular.module('portfolios').controller('PortfoliosCtrl', [
    '$window',
    '$filter',
    '$scope',
    'api',
    'apiUtils',
    'sidepanel',
    'prompt',
    '$timeout',
    function($window, $filter, $scope, api, apiUtils, sidepanel, prompt, $timeout) {
      $scope.init = function(forceRefresh) {
        $scope.loading = true;
        $scope.portfolios = null;
        $scope.error = null;

        api.getMyAssets(forceRefresh).then(function(assets) {
          $scope.portfolios = apiUtils.portfolios(assets).map(function(portfolio) {
            portfolio.var24 = Math.random() - 0.5;
            portfolio.var168 = Math.random() - 0.5;
            portfolio.assets = apiUtils.portfolioAssets(portfolio);
            return portfolio;
          });

          $timeout($scope.initCharts);
        }).catch(function(err) {
          $scope.error = err;
        }).finally(function() {
          $scope.loading = false;
        });
      };

      $scope.init();
      $scope.$on('portfolios.refresh', function() {
        $scope.init(true);
      });

      $scope.promptForm = function promptForm(portfolio) {
        sidepanel.show('portfolios/templates/panel-form-portfolio.html', portfolio);
      };

      $scope.promptDelete = function promptDelete(portfolioid, id) {
        prompt.show('PROMPT.DELETE_PORTFOLIO.TITLE', 'PROMPT.DELETE_PORTFOLIO.TEXT', [{
          label: 'PROMPT.DELETE_PORTFOLIO.ACTION_CONFIRM',
          do: $scope.doDelete.bind($scope, portfolioid, id),
          success: 'portfolios.refresh'
        }]);
      };

      $scope.doDelete = function(id) {
        return api.call('DELETE', '/AssetManagement/DeletePortfolio', {
          id: id
        });
      };

      $scope.initCharts = function() {
        var chartOptions = {
          maintainAspectRatio: false,
          spanGaps: false,
          elements: {
            line: {
              tension: 0.000001
            }
          },
          plugins: {
            filler: {
              propagate: false
            }
          },
          layout: {
            padding: {
              left: -10,
              right: 0,
              top: 0,
              bottom: -10
            }
          },
          scales: {
            xAxes: [{
              ticks: {
                display: false
              },
              gridLines: {
                display: false,
                drawBorder: false
              }
            }],
            yAxes: [{
              ticks: {
                display: false
              },
              gridLines: {
                display: false,
                drawBorder: false
              }
            }]
          },
          hover: {
            mode: 'nearest',
            intersect: false
          },
          tooltips: {
            mode: 'nearest',
            intersect: false,
          },
          legend: {
            display: false
          }
        };

        $scope.portfolios.forEach(function(portfolio) {
          portfolio.loadingHistory = true;
          api.call('POST', '/AssetValue/PortfolioHistory', {
            portfolioid: portfolio.id,
            mappedquoteid: 21 // USD
          }).then(function(history) {
            portfolio.history = history;

            if (portfolio.history.length < 2) {
              portfolio.nodata = true;
              return;
            }

            new window.Chart(document.getElementById('portfolio-' + portfolio.id + '-chart'), {
              type: 'line',
              data: {
                labels: history.map(function(entry) {
                  return window.moment(entry.time).format('ddd DD/MM, HH:mm');
                }),
                datasets: [{
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderColor: '#aaa',
                  data: history.map(function(entry) {
                    return Math.floor(entry.value);
                  }),
                  label: $filter('translate')('PORTFOLIOS.VALUE') + ' (USD)',
                  fill: 'start',
                  pointRadius: 1
                }]
              },
              options: chartOptions
            });

          }).catch(function(err) {
            portfolio.errorHistory = err;
          }).finally(function() {
            portfolio.loadingHistory = false;
          });
        });
      };
    }]);
})(window);

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

      var tooltipTimeouts = {};
      function customTooltips(tooltip) {
        if (!tooltip || !tooltip.title || !tooltip.body) {
          return;
        }

        var timestamp = Number(tooltip.title[0]);
        var portfolioId = tooltip.body[0].lines[0].split(':')[0];
        var value = Number(tooltip.body[0].lines[0].split(': ')[1]);

        var el = $window.document.getElementById('portfolio-' + portfolioId + '-tooltip');
        if (!el) {
          return;
        }

        var html = $window.moment(timestamp).format('ddd DD/MM, HH:mm') + ' : ' + $filter('num')(value);
        el.innerHTML = html;
        el.style.opacity = 1;

        if (tooltipTimeouts[portfolioId]) {
          clearTimeout(tooltipTimeouts[portfolioId]);
        }
        tooltipTimeouts[portfolioId] = setTimeout(function() {
          el.style.opacity = 0;
        }, 3000);
      }

      $scope.initCharts = function() {
        var chartOptions = {
          maintainAspectRatio: false,
          spanGaps: false,
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
            enabled: false,
            position: 'nearest',
            custom: customTooltips
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
            portfolio.history.push({
              value: portfolio.values[0].value,
              time: Date.now()
            });

            if (portfolio.history.length < 2) {
              portfolio.nodata = true;
              return;
            }

            var options = window.angular.copy(chartOptions);
            var dataMax = history[0].value;
            var dataMin = history[0].value;
            var lastDay = history[0];
            var lastWeek = history[0];
            history.forEach(function(entry) {
              if (entry.value > dataMax) {
                dataMax = entry.value;
              }
              if (entry.value < dataMin) {
                dataMin = entry.value;
              }

              // get the closest entry to 24h ago
              var currentLastDayDiff = Math.abs(lastDay.time - (Date.now() - 24 * 36e5));
              var currentEntryDayDiff = Math.abs(entry.time - (Date.now() - 24 * 36e5));
              if (currentEntryDayDiff < currentLastDayDiff) {
                lastDay = entry;
              }

              // get the closest entry to 7days ago
              var currentLastWeekDiff = Math.abs(lastDay.time - (Date.now() - 7 * 24 * 36e5));
              currentEntryDayDiff = Math.abs(entry.time - (Date.now() - 7 * 24 * 36e5));
              if (currentEntryDayDiff < currentLastWeekDiff) {
                lastWeek = entry;
              }
            });
            options.scales.yAxes[0].ticks.max = Math.ceil(dataMax);
            options.scales.yAxes[0].ticks.min = Math.floor(dataMin);
            portfolio.var24 = (-1 + history[history.length - 1].value / lastDay.value) * 100;
            portfolio.var168 = (-1 + history[history.length - 1].value / lastWeek.value) * 100;

            var ctx = document.getElementById('portfolio-' + portfolio.id + '-chart').getContext('2d');
            var gradientArea = ctx.createLinearGradient(0, 0, 400, 0);
            gradientArea.addColorStop(0, '#81B9E5');
            gradientArea.addColorStop(1, '#50C3CD');

            var gradientFill = ctx.createLinearGradient(0, 0, 400, 0);
            gradientFill.addColorStop(1, '#83B6E6');
            gradientFill.addColorStop(0, '#52C4CD');

            function dataFilter(el, index) {
              return index === history.length - 1 || (index % (Math.floor(history.length / 14)) === 0);
            }

            new window.Chart(document.getElementById('portfolio-' + portfolio.id + '-chart'), {
              type: 'line',
              data: {
                labels: history.map(function(entry) {
                  return entry.time;
                }).filter(dataFilter),
                datasets: [{
                  backgroundColor: gradientArea,
                  borderColor: gradientFill,
                  lineThickness: 4,
                  data: history.map(function(entry) {
                    return Math.floor(entry.value);
                  }).filter(dataFilter),
                  label: portfolio.id,
                  fill: 'start',
                  pointRadius: 1
                }]
              },
              options: options
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

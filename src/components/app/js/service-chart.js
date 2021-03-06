'use strict';

(function closure(window) {
  window.angular.module('app').service('chart', [
    '$window',
    '$filter',
    'value',
    'settings',
    function($window, $filter, value, settings) {
      var TOOLTIP_TIMEOUT = 3000;
      var lineChartOptions = {
        maintainAspectRatio: false,
        spanGaps: false,
        plugins: {
          filler: {
            propagate: false
          }
        },
        layout: {
          padding: {
            left: 5,
            right: 0,
            top: 0,
            bottom: 5
          }
        },
        scales: {
          xAxes: [{
            type: 'time',
            display: true,
            time: {
              displayFormats: {
                'millisecond': 'YYYY-MM-DD HH:mm',
                'second': 'YYYY-MM-DD HH:mm',
                'minute': 'YYYY-MM-DD HH:mm',
                'hour': 'YYYY-MM-DD HH:mm',
                'day': 'MMM DDD',
                'week': 'YYYY-MM-DD HH:mm',
                'month': 'YYYY-MM-DD HH:mm',
                'quarter': 'YYYY-MM-DD HH:mm',
                'year': 'YYYY-MM-DD HH:mm'
              }
            },
            ticks: {
              callback: function(dataLabel, index) {
                // Hide the label of every 2nd dataset. return null to hide the grid line too
                return index % 3 === 0 ? dataLabel : '';
              },
              minRotation: 0,
              maxRotation: 0,
              fontColor: 'rgba(0, 0, 0, .4)'
            },
            gridLines: {
              color: 'rgba(0, 0, 0, .05)'
            }
          }],
          yAxes: [{
            ticks: {
              display: true,
              callback: function(label, index, labels) {
                if (index === 0 || index === labels.length - 1) {
                  return '';
                }
                return value.display(label);
              },
              fontColor: 'rgba(0, 0, 0, .4)'
            },
            gridLines: {
              display: false,
              drawBorder: false
            }
          }]
        },
        hover: {
          mode: 'index',
          intersect: false
        },
        tooltips: {
          mode: 'index',
          intersect: false,
          enabled: false,
          custom: lineCustomTooltips
        },
        legend: {
          display: false
        },
        elements: {
          points: {
            pointStyle: 'circle'
          }
        }
      };

      var tooltipTimeouts = {};
      function lineCustomTooltips(tooltip) {
        if (!tooltip || !tooltip.title || !tooltip.body) {
          return;
        }

        var timestamp = Number(tooltip.title[0]);
        var portfolioId = tooltip.body[0].lines[0].split(':')[0];
        var val = Number(tooltip.body[0].lines[0].split(': ')[1]);

        var el = $window.document.getElementById('tooltip-' + portfolioId);
        if (!el) {
          return;
        }

        var html = $window.moment(timestamp).format('ddd DD/MM, HH:mm') + ' : ' + value.display(val);
        el.innerHTML = html;
        el.style.opacity = 1;

        if (tooltipTimeouts[portfolioId]) {
          clearTimeout(tooltipTimeouts[portfolioId]);
        }
        tooltipTimeouts[portfolioId] = setTimeout(function() {
          el.style.opacity = 0;
        }, TOOLTIP_TIMEOUT);
      }

      return {
        drawLine: drawLine,
        getVarValue: getVarValue,
        getVar: getVar
      };

      function getVar(history, since) {
        if (history.length) {
          var closest = getVarValue(history, since);
          return (-1 + history[history.length - 1].value / closest.value) * 100;
        }
        return 0;
      }

      function getVarValue(history, since) {
        var closest = history[0];
        history.forEach(function(entry) {
          // get the closest entry to 24h ago
          var currentDiff = Math.abs(closest.time - since);
          var entryDiff = Math.abs(entry.time - since);
          if (entryDiff < currentDiff) {
            closest = entry;
          }
        });
        return closest;
      }

      function drawLine(id, history, nPoints, args) {
        if (!history || history.length === 0) {
          return;
        }
        args = args || {};
        var options = window.angular.copy(lineChartOptions);

        var canvas = document.getElementById('chart-' + id);
        if (!canvas) {
          return null;
        }
        var ctx = canvas.getContext('2d');
        var gradientArea = ctx.createLinearGradient(0, 0, 400, 0);
        gradientArea.addColorStop(0, 'rgba(129, 185, 229, 0.7)');
        gradientArea.addColorStop(1, 'rgba(80, 195, 205, 0.7)');

        var gradientFill = ctx.createLinearGradient(0, 0, 400, 0);
        gradientFill.addColorStop(1, '#83B6E6');
        gradientFill.addColorStop(0, '#52C4CD');

        var filteredData = history.filter(function dataFilter(el, index) {
          if (nPoints && 2 * nPoints < history.length) {
            return index === history.length - 1 || (index % (Math.floor(history.length / (nPoints - 2))) === 0);
          }
          return true;
        });

        var dataMax = filteredData[0].value;
        var dataMin = filteredData[0].value;
        var timeMin = filteredData[0].time;
        var timeMax = filteredData[0].time;
        filteredData.forEach(function(entry) {
          if (entry.value > dataMax) {
            dataMax = entry.value;
          }
          if (entry.value < dataMin) {
            dataMin = entry.value;
          }
          if (entry.time > timeMax) {
            timeMax = entry.time;
          }
          if (entry.time < timeMin) {
            timeMin = entry.time;
          }
        });
        options.scales.yAxes[0].ticks.max = Math.ceil(dataMax + 0.05 * dataMax);
        options.scales.yAxes[0].ticks.min = Math.floor(0.5 * dataMin);
        options.scales.yAxes[0].ticks.stepSize = (options.scales.yAxes[0].ticks.max - options.scales.yAxes[0].ticks.min) / 5;

        var timespan = timeMax - timeMin;
        var dateFormat = 'YYYY-MM-DD HH:mm';
        if (timespan <= 48 * 36e5) {
          dateFormat = 'HA';
        } else if (timespan <= 10 * 24 * 36e5) {
          dateFormat = 'ddd D MMM';
        } else if (timespan <= 100 * 24 * 36e5) {
          dateFormat = 'DD MMM';
        } else {
          dateFormat = 'DD/MM/YY';
        }
        for (var key in options.scales.xAxes[0].time.displayFormats) {
          options.scales.xAxes[0].time.displayFormats[key] = dateFormat;
        }

        if (args.noaxis) {
          options.scales.yAxes[0].display = false;
          options.scales.xAxes[0].display = false;
          options.layout.padding.left = 0;
          options.layout.padding.bottom = 0;
        }

        var c = new window.Chart(canvas, {
          type: 'line',
          data: {
            labels: filteredData.map(function(entry) {
              return entry.time;
            }),
            datasets: [{
              backgroundColor: args.fillColor || gradientArea,
              borderColor: args.lineColor || gradientFill,
              lineThickness: 4,
              data: filteredData.map(function(entry) {
                return entry.value;
              }),
              label: id,
              fill: 'start',
              pointRadius: 0,
              /* pointRadius: args.nopoints ? 0 : 5,
              pointBorderColor: '#fff',
              pointBorderWidth: 2,*/
              pointHoverRadius: args.nopoints ? 0 : 5,
              pointHoverBackgroundColor: '#5b17a7',
              pointHoverBorderWidth: 10,
              pointHoverBorderColor: 'rgba(255,255,255,0.5)'
            }]
          },
          options: options
        });

        var boatElement = document.getElementById('boat-' + id);

        c.removeAndDestroy = function() {
          c.canvas.onmousemove = null;
          if (boatElement) {
            boatElement.style.opacity = 0;
          }
          c.destroy();
        };

        if (!boatElement || !nPoints || !settings.get('show-boat', false)) {
          return c;
        }
        var previousX = 0;
        c.canvas.onmousemove = function(ev) {
          var points = c.getDatasetMeta(0).data.map(function(point) {
            return { x: point._view.x, y: point._view.y };
          });
          var near = points.sort(function(a, b) {
            var da = Math.abs(a.x - ev.offsetX);
            var db = Math.abs(b.x - ev.offsetX);
            return da > db ? 1 : -1;
          }).slice(0, 2).sort(function(a, b) {
            return a.x > b.x ? 1 : -1;
          });

          if (ev.offsetX <= near[0].x) {
            return;
          }

          var dx = near[1].x - near[0].x;
          var dy = near[1].y - near[0].y;
          var a = dy / dx;
          var b = near[0].y;

          var angle = 360 * (Math.atan(dy / dx) / (2 * Math.PI));

          boatElement.style.left = ev.offsetX + 'px';
          boatElement.style.top = (a * (ev.offsetX - near[0].x) + b) + 'px';
          var rotateY = '0deg';
          if (previousX < ev.offsetX) {
            rotateY = '180deg';
          }
          boatElement.style.transform = 'rotateZ(' + angle + 'deg) rotateY(' + rotateY + ')';
          boatElement.style.opacity = 1;
          previousX = ev.offsetX;

          if (c.boatTimeout) {
            clearTimeout(c.boatTimeout);
          }

          c.boatTimeout = setTimeout(function() {
            boatElement.style.opacity = 0;
          }, TOOLTIP_TIMEOUT);
        };

        return c;
      }
    }
  ]);
})(window);

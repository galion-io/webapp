'use strict';

(function closure(window) {
  window.angular.module('app').service('chart', [
    '$window',
    '$filter',
    'value',
    function($window, $filter, value) {
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
            left: 0,
            right: 0,
            top: 0,
            bottom: -15
          }
        },
        scales: {
          xAxes: [{
            ticks: {
              display: false
            },
            gridLines: {
              display: true,
              drawBorder: false,
              color: 'rgba(0, 0, 0, 0.05)',
              lineWidth: 1
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
          mode: 'nearest',
          intersect: false
        },
        tooltips: {
          mode: 'nearest',
          intersect: false,
          enabled: false,
          position: 'nearest',
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
      var pieChartOptions = {
        type: 'doughnut',
        maintainAspectRatio: false,
        data: {},
        options: {
          legend: {
            position: 'bottom',
            display: false
          },
          title: {
            display: false
          },
          tooltips: {
            enabled: false,
            custom: pieCustomTooltips
          },
          animation: {
            animateScale: true,
            animateRotate: true
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

      var basePieCenterHTML = null;
      function pieCustomTooltips(tooltip) {
        if (!tooltip || !tooltip.title || !tooltip.body) {
          return;
        }

        var el = $window.document.getElementById('tooltip-pie');
        if (!el) {
          return;
        }

        if (!el.attributes.used) {
          basePieCenterHTML = el.innerHTML;
          el.setAttribute('used', 'yes');

          var canvas = $window.document.getElementById(el.attributes.for.value);
          canvas.onmouseleave = function() {
            el.innerHTML = basePieCenterHTML;
          };
        }

        var serie = tooltip.body[0].lines[0].split(':');
        var label = serie[0].trim();
        var count = Number(serie[1]);
        el.innerHTML = '<strong>' + label + '</strong><br>' + value.display(count);
        el.style.opacity = 1;
      }

      return {
        drawLine: drawLine,
        drawPie: drawPie,
        getVar: getVar
      };

      function getVar(history, since) {
        var closest = history[0];
        history.forEach(function(entry) {
          // get the closest entry to 24h ago
          var currentDiff = Math.abs(closest.time - since);
          var entryDiff = Math.abs(entry.time - since);
          if (entryDiff < currentDiff) {
            closest = entry;
          }
        });
        return (-1 + history[history.length - 1].value / closest.value) * 100;
      }

      function drawLine(id, history, nPoints, args) {
        args = args || {};
        var options = window.angular.copy(lineChartOptions);
        var dataMax = history[0].value;
        var dataMin = history[0].value;
        history.forEach(function(entry) {
          if (entry.value > dataMax) {
            dataMax = entry.value;
          }
          if (entry.value < dataMin) {
            dataMin = entry.value;
          }
        });
        options.scales.yAxes[0].ticks.max = Math.ceil(dataMax + 0.05 * dataMax);
        options.scales.yAxes[0].ticks.min = Math.floor(dataMin);
        options.scales.yAxes[0].ticks.stepSize = (options.scales.yAxes[0].ticks.max - options.scales.yAxes[0].ticks.min) / 5;

        var canvas = document.getElementById('chart-' + id);
        var ctx = canvas.getContext('2d');
        var gradientArea = ctx.createLinearGradient(0, 0, 400, 0);
        gradientArea.addColorStop(0, 'rgba(129, 185, 229, 0.7)');
        gradientArea.addColorStop(1, 'rgba(80, 195, 205, 0.7)');

        var gradientFill = ctx.createLinearGradient(0, 0, 400, 0);
        gradientFill.addColorStop(1, '#83B6E6');
        gradientFill.addColorStop(0, '#52C4CD');

        function dataFilter(el, index) {
          if (nPoints) {
            return index === history.length - 1 || (index % (Math.floor(history.length / (nPoints - 2))) === 0);
          }
          return true;
        }

        if (args.noaxis) {
          options.scales.yAxes[0].display = false;
          options.scales.xAxes[0].display = false;
        }

        var c = new window.Chart(canvas, {
          type: 'line',
          data: {
            labels: history.map(function(entry) {
              return entry.time;
            }).filter(dataFilter),
            datasets: [{
              backgroundColor: args.fillColor || gradientArea,
              borderColor: args.lineColor || gradientFill,
              lineThickness: 4,
              data: history.map(function(entry) {
                return Math.floor(entry.value);
              }).filter(dataFilter),
              label: id,
              fill: 'start',
              pointRadius: args.nopoints ? 0 : 5,
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointHoverRadius: args.nopoints ? 0 : 5,
              pointHoverBackgroundColor: '#5b17a7',
              pointHoverBorderWidth: 10,
              pointHoverBorderColor: 'rgba(255,255,255,0.5)'
            }]
          },
          options: options
        });

        var boatElement = document.getElementById('boat-' + id);
        if (!boatElement) {
          return;
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
      }

      function drawPie(id, data, args) {
        var options = window.angular.copy(pieChartOptions);
        var colors = ['#3F549C', '#9733CD', '#C6519A', '#F33FAB', '#F76A92'];

        options.data = {
          datasets: [{
            data: data.map(function(d) { return d.value; }),
            backgroundColor: data.map(function(d, i) { return d.color || colors[i % colors.length]; }),
            label: 'dataset-1'
          }],
          labels: data.map(function(d) { return d.label; })
        };

        var canvas = $window.document.getElementById('pie-' + id);

        var ctx = canvas.getContext('2d');
        var c = new window.Chart(ctx, options);
        return c;
      }
    }
  ]);
})(window);

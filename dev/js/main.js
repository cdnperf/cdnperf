$(main);

function main() {
    var tooltips = [], charts = [];

    $.getJSON('./data.json', function(d) {
        var data = attachColors(groupData(d));
        var state = initializeState(data.providers);
        var update = updateAll.bind(undefined, $('.content.row'), data, state);
        var updateWithRoute, router;

        $(window).on('resize', function () {
            tooltips.forEach(function (tooltip) {
                if (tooltip && $(tooltip.drop.drop).is(':visible')) {
                    tooltipPosition(tooltip);
                }
            });
        });

        router = initializeRouter(state, update);

        updateWithRoute = union(update, updateRoute.bind(undefined, state, router));

        createControls(state, updateWithRoute);
        createLegend($('.legendContainer .columns'), data, state, updateWithRoute);

        update();
    });

    function union() {
        var args = arguments;

        return function() {
            for(var i = 0; i < args.length; i++) {
                args[i]();
            }
        };
    }

    function initializeRouter(state, update) {
        var Router = Backbone.Router.extend({
            routes: {
                ':providers': 'providers',
                ':providers/:type': 'providersWithType',
                ':providers/:type/:amount': 'all'
            },
            providers: function(providers) {
                state.providers = providers.split(',');

                update();
            },
            providersWithType: function(providers, type) {
                state.type = type;

                this.providers(providers);
            },
            all: function(providers, type, amount) {
                state.amount = amount;

                this.providersWithType(providers, type);
            }
        });
        var router = new Router();

        Backbone.history.start();

        return router;
    }

    function updateRoute(state, router) {
        var providers = state.providers.toString();
        var type = state.type;
        var amount = state.amount;
        var url = '/' + providers + '/' + type + '/' + amount;

        router.navigate(url, {replace: true});

        localStorage.setItem('index', '/#' + url);
    }

    function initializeState(data) {
        return {
            type: '',
            amount: '',
            providers: Object.keys(data).map(idfy)
        };
    }

    function groupData(data) {
        var providers = {};
        var wholeDayInMs = 1000 * 60 * 60 * 24;

        data.providers.forEach(function(v) {
            var name = getProviderName(v.name);

            if(!(name in providers)) providers[name] = {
                types: {},
                host: getHost(v.host)
            };
            if(!(v.type in providers[name].types)) providers[name].types[v.type] = {
                latency: v.latency,
                uptime: v.downtime.map(function(v) {
                    if(v) return parseFloat(((1 - (v / wholeDayInMs)) * 100).toFixed(3));

                    return 100;
                }),
                downtime: v.downtime
            };
        });

        return {
            providers: providers,
            firstDate: new XDate(data.firstDate * 1000),
            lastDate: new XDate(data.lastDate * 1000)
        };
    }

    function getHost(name) {
        var hosts = {
            'ajax.aspnetcdn.com': 'www.asp.net/ajaxlibrary/cdn.ashx',
            'ajax.googleapis.com': 'developers.google.com/speed/libraries/',
            'netdna.bootstrapcdn.com': 'www.bootstrapcdn.com/'
        };

        if(name in hosts) return hosts[name];

        return name;
    }

    function toFixed(a) {
        return function(v) {
            return parseFloat(v.toFixed(a), 10);
        };
    }

    function attachColors(data) {
        var i = 0;

        for(var name in data.providers) {
            data.providers[name].color = getColor(i);

            i++;
        }

        return data;
    }

    function createControls(state, update) {
        createTypes(state, update);
        createAmounts(state, update);
    }

    function createTypes(state, update) {
        $controls($('.typeControls'), state, update, 'type', ['ping', 'http', 'https'], state.type || 'http');
    }

    function createAmounts(state, update) {
        $controls($('.durationControls'), state, update, 'amount', [7, 30, 90], state.amount || 90);
    }

    function $controls($p, state, update, type, items, selected) {
        items.forEach($control.bind(undefined, $p, state, type, update));

        $('.' + selected, $p).attr('checked', 'checked');
        if(!state[type]) state[type] = selected;

        $('<span>', {'class': 'slide-button'}).appendTo($p);
    }

    function $control($p, state, type, update, name) {
        var id = 'control_' + name;
        var $e = $('<input>', {
            'class': 'control ' + type + ' ' + name,
            'name': type,
            'type': 'radio',
            'id': id
        }).on('click', function(e) {
            if(state[type] == name) return;

            mixpanel.track('clicked ' + type + ':' + name);

            state[type] = name;

            update();
        }).appendTo($p);

        $('<label>', {'for': id}).text(name).appendTo($p);
    }

    function updateAll($p, data, state) {
        cleanup();
        updateCharts($p, data, state);
        updateLegend($p, data, state);
    }

    function cleanup() {
        tooltips.splice(0).forEach(function(tooltip) {
            if (tooltip && tooltip.drop && tooltip.drop.content){
				tooltip.destroy();
			}
        });

        charts.splice(0).forEach(function(chart) {
            if (chart) {
                chart.destroy();
            }
        });
    }

    function updateCharts($p, data, state) {
        var providers = Object.keys(data.providers);

        updateUptimeChart($('.uptimeContainer'), data, state, 'uptime', 70, function(data, index) {
            return $('<div></div>').append($('<table class="tooltip-table tooltip-table-uptime"><col align="left"><col align="right"></table>').append(data.datasets.map(function(provider, i) {
                return $('<tr></tr>')
                    .append($('<td><span class="tooltip-dot" style="background-color: ' + provider.pointColor + ';"></span></td>')
                    .append(providers[i])).append($('<td></td>').html(provider.data[index].toFixed(3) + '% <span class="downtime">' + calculateDowntime((100 - provider.data[index]) / (100 * 60 * 60 * 24 * 1000)) + ' downtime</span>'));
            }))).html();
        });
        updateLatencyChart($('.latencyContainer'), data, state, 'latency', 300, function(tooltip) {
           return '<strong>' + tooltip.title + '</strong>' + $('<div></div>').append($('<table class="tooltip-table"><col align="left"><col align="right"></table>').append(tooltip.labels.map(function(label, i) {
                return $('<tr></tr>')
                    .append($('<td><span class="tooltip-dot" style="background-color: ' + tooltip.legendColors[i].stroke + ';"></span></td>')
                    .append(state.providers[i])).append($('<td></td>').html(parseFloat(label).toFixed(3) + ' ms'));
            }))).html();
        });
    }

    function updateUptimeChart($el, data, state, category, height, tooltipCb) {
        data = getData(data, state, category);
        var points = data.labels.map(function(label, index) {
            return data.datasets.every(function(ds) {
                return ds.data[index] === 100;
            }) ? '#6ad378' : '#ffef3c';
        });

        var $c = $el.find('.uptime-chart').empty();

        if (!$c.length) {
            $c = $('<div class="uptime-chart"></div>').css('height', height).appendTo($el);
        }

        $c.append(data.labels.map(function(label, index) {
            var i;
            var $div = $('<div></div>').css({
                float: 'left',
                width: (100 / data.labels.length) + '%',
                height: '100%'
            }).attr('data-label', label).on('mouseover', function () {
                var int = setInterval(function () {
                    if ($(tooltips[i].drop.drop).is(':visible')) {
                        tooltipPosition(tooltips[i]);
                        clearInterval(int);
                    }
                }, 5);
            });

            i = tooltips.push(new Tooltip({
                target: $div[0],
                content: '<strong>' + label + '</strong>' + (tooltipCb(data, index)),
                position: 'top center'
            })) - 1;

            return $div;
        })).css('background', 'linear-gradient(to right, ' + points.join(',') + ')');
    }

    function  updateLatencyChart($p, data, state, category, height, tooltipCb) {
        var $canvas = $('.chart:first', $p);
        var ctx, width;

        if(!$canvas.length) $canvas = $('<canvas>', {'class': 'chart'}).appendTo($p);

        // dynamic width (parent width might change)
        width = $canvas.parent().width();

        $canvas.attr({width: width, height: height});

        ctx = $canvas[0].getContext('2d');

        chart(ctx, getData(data, state, category), tooltipCb);
    }

    function updateLegend($p, data, state) {
        updateType(data, state, 'latency', function(state, values) {
            return average(values.slice(-state.amount)).toFixed(1) + ' ms';
        });

        updateType(data, state, 'uptime', function(state, values) {
            return average(values.slice(-state.amount)).toFixed(3) + ' %';
        });

        updateType(data, state, 'downtime', function(state, values) {
            return calculateDowntime(sum(values.slice(-state.amount)), true);
        });
    }

    function calculateDowntime(val) {
        var epochStart = new Date(0);
        var downTime = new Date(val);
        var hours = downTime.getHours() - epochStart.getHours();
        var minutes = downTime.getMinutes();
        var seconds = downTime.getSeconds();
        var milliseconds = downTime.getMilliseconds();
        var ret = '';

        if(hours) ret += hours + 'h ';
        if(minutes) ret += minutes + 'min ';

        ret += seconds + 's';

        if(!hours && !minutes) ret += ' ' + milliseconds + 'ms';

        return ret;
    }

    function updateType(data, state, type, calculateValue) {
        var providers = data.providers;
        var tdClass, value, name;

        for(name in providers) {
            value = 'NA';
            provider = providers[name];
            tdClass = idfy(name);

            if(state.type in provider.types) {
                values = provider.types[state.type][type];

                value = values && calculateValue(state, values);
            }

            $('.' + type + '.' + tdClass).html(value);
        }
    }

    function chart(ctx, data, tooltipCb) {
        // https://github.com/nnnick/Chart.js/issues/76
        var min = minimum(data.datasets.map(op(minimum, prop('data'))));
        var max = maximum(data.datasets.map(op(maximum, prop('data'))));
        var ti, hp = $('<div></div>').css({ position: 'absolute', top: 0, left: 0 }).appendTo('body'), opts = {
            responsive: true,
            scaleFontSize: 13,
            scaleFontFamily: 'Ubuntu, sans-serif',
            scaleFontColor: '#969ea6',
            animation: true,
            animationSteps: 10,
            datasetFill: false,
        };

        if(max == min) {
            opts.scaleOverride = true;
            opts.scaleSteps = 3;
            opts.scaleStepWidth = 1;
            opts.scaleStartValue = max - 3;
        }
        else {
            opts.pointDot = true;
            opts.scaleShowGridLines = true;
            opts.scaleGridLineColor = 'rgba(224,224,224,0.5)';
            opts.scaleGridLineWidth = 1;
            opts.pointDotRadius = 3;
            opts.bezierCurve = false;
        }

        opts.customTooltips = function(tooltip) {
            var tt = tooltips[ti];

			if (tt && tt.drop && tt.drop.content){
				tt.destroy();
                tooltips[ti] = null;
			}

            if (!tooltip) {
                return;
            }

            ti = tooltips.push(new Tooltip({
                target: hp[0],
                content: tooltipCb(tooltip),
                position: 'top center'
            })) - 1;

			hp.css({
				top: $(ctx.canvas).offset().top,
				left: $(ctx.canvas).offset().left,
				transform: 'translateX(' + (tooltip.x - 10) + 'px) translateY(' + tooltip.yPadding + 'px) translateZ(0px)'
			});

			tooltips[ti].open();
            tooltipPosition(tooltips[ti]);
        };

        charts.push(new Chart(ctx, {}, tooltipCb).Line(data, opts));
    }

    function tooltipPosition (tooltip) {
        var pat = /\([^)]+\)/,
            wid = parseFloat(getComputedStyle(tooltip.drop.content).width),
            trX = parseFloat(tooltip.drop.drop.style.transform.match(pat)[0].substr(1));

        if (trX < 0) {
            tooltip.drop.drop.style.transform = tooltip.drop.drop.style.transform.replace(pat, '(0px)');
        }

        if (trX > window.innerWidth - wid - 20) {
            tooltip.drop.drop.style.transform = tooltip.drop.drop.style.transform.replace(pat, '(' + (window.innerWidth - wid - 20) + 'px)');
        }
    }

    function op(fn, accessor) {
        return function(v) {
            return fn(accessor(v));
        };
    }

    function minimum(a) {
        return a.slice().sort()[0];
    }

    function maximum(a) {
        return a.slice().sort()[a.length - 1];
    }

    function createLegend($container, data, state, update) {
        var $table = $('<table>', {'class': 'legend'}).appendTo($container);
        var $header = $('<tr>').appendTo($table);
        var providers = data.providers;
        var provider, color, name, host;

        $('<th>', {'class': 'names'}).html('&nbsp;').appendTo($header);

        for(name in providers) {
            provider = providers[name];
            host = provider.host;
            color = provider.color;

            createTh(state, name, host, color, update).appendTo($header);
        }

        createRow(state, providers, 'latency', 'Latency <sup>1</sup>').appendTo($table);
        createRow(state, providers, 'uptime', 'Uptime <sup>2</sup>').appendTo($table);
        createRow(state, providers, 'downtime', 'Downtime <sup>3</sup>').appendTo($table);
    }

    function createTh(state, name, host, color, update) {
        if(!color) {
            console.warn('host', host, 'is missing color!');
        }

        var thClass = idfy(name);
        var $e = $('<th>', {'class': 'cdn ' + thClass}).css({
            'background-color': colorToHex(color)
        });
        $('<a>', {href: 'http://' + host}).css({
            'color': '#fff'
        }).text(name).appendTo($e);

        var $icon = $('<i>', {'class': 'visibility fa'}).css({
            'color': '#fff'
        }).on('click', function() {
            $icon.toggleClass('fa-check-square fa-square');

            toggleItem(state.providers, idfy(name), $icon.hasClass('fa-check-square'));

            update();
        }).appendTo($e);

        if(within(state.providers, thClass)) {
            $icon.addClass('fa-check-square');
        } else {
            $icon.addClass('fa-square');
        }

        return $e;
    }

    function toggleItem(arr, k, v) {
        var i;

        if(v) {
            if(!within(arr, k)) arr.push(k);
        }
        else {
            i = arr.indexOf(k);

            if(i >= 0) arr.splice(i, 1);
        }
    }

    function idfy(val) {
        return val.toLowerCase().replace(/[ \-\(\)]+/g, '_').replace(/\.+/g, '');
    }

    function createRow(state, providers, id, title) {
        var $row = $('<tr>');
        var name, provider, tdClass;

        $('<td>', {'class': id + ' title'}).html(title).appendTo($row);

        for(name in providers) {
            provider = providers[name];
            tdClass = idfy(name);

            $('<td>', {'class': id + ' ' + tdClass}).appendTo($row);
        }

        return $row;
    }

    function average(arr) {
        if(!arr) return;

        return sum(arr) / arr.length;
    }

    function sum(arr) {
        if(!arr) return;

        return arr.reduce(function(a, b) {
            return a + b;
        });
    }

    function getData(data, state, category) {
        return {
            labels: getLabels(data.lastDate, state.amount),
            datasets: getDatasets(data.providers, state, category)
        };
    }

    function getLabels(lastDate, amount) {
        var ret = [];
        var len = amount;
        var i, d;

        // TODO: move these rules elsewhere
        if(amount == 90) len = 30;

        for(i = 0; i < len; i++) {
            d = lastDate.clone();

            // TODO: move these rules elsewhere
            if(amount == 90) d.addDays(-(90 - i * 3 - 1));
            else d.addDays(-(amount - i - 1));

            ret.push(d.toString('dd MMM') + (amount == 90 ? ' - ' + d.addDays(2).toString('dd MMM') : ''));
        }

        return ret;
    }

    function getDatasets(providers, state, category) {
        var ret = [];
        var provider, color, data, offset;

        for(var name in providers) {
            provider = providers[name];
            color = colorToHex(provider.color);

            if(!within(state.providers, idfy(name))) continue;
            if(!(state.type in provider.types)) continue;
            if(!(category in provider.types[state.type])) continue;

            data = provider.types[state.type][category];

            offset = state.amount - data.length;
            if(offset > 0) data = zeroes(offset).concat(data);
            else data = data.slice(-state.amount);

            ret.push({
                strokeColor: color,
                pointColor: color,
                pointStrokeColor: color,
                data: pickPoints(state.amount, data)
            });
        }

        return ret;
    }

    function pickPoints(amount, data) {
        if(amount == 90) {
            var nd = [];

            for (var i = 0; i < 90; i += 3) {
                nd.push(((data[i] + data[i + 1] + data[i + 2]) / 3));
            }

            return nd;
        }

        return data;
    }

    function everyNth(n, data) {
        return data.filter(function(v, i) {
            return !(i % n);
        });
    }

    function zeroes(amount) {
        var ret = [];
        var i;

        for(i = 0; i < amount; i++) ret.push(0);

        return ret;
    }

    function within(arr, v) {
        return arr.indexOf(v) >= 0;
    }

    function getProviderName(fullname) {
        return fullname.split(' ')[0];
    }

    function flipColor(color) {
        /* flips color to black or white based on brightness */
        /* http://javascriptrules.com/2009/08/05/css-color-brightness-contrast-using-javascript/ */
        if(!color) {
            return;
        }

        var brightness = (color[0] * 299 + color[1] * 587 + color[2] * 114) / 1000;

        if(brightness > 125) return [0, 0, 0];

        return [255, 255, 255];
    }

    function colorToHex(color) {
        if(!color) {
            return;
        }

        return '#' + color.map(function(v) {
            return v.toString(16);
        }).join('');
    }

    function getColor(index) {
        return [
            [232, 77, 61],
            [75, 184, 157],
            [246, 174, 78],
            [84, 138, 200],
            [68, 68, 68],
            [174, 90, 160],
            [81, 177, 105]
        ][index];
    }

    function unique(arr) {
        var ret = {};

        arr.forEach(function(v) {
            ret[v] = true;
        });

        return Object.keys(ret);
    }

    function prop(name) {
        return function(v) {
            return v[name];
        };
    }
}

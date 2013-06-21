$(main);

function main() {
    $.getJSON('./data.json', function(d) {
        var data = attachColors(groupData(d));
        var state = initializeState(data.providers);
        var update = updateAll.bind(undefined, $('.content.row'), data, state);
        var updateWithRoute, router;

        $(window).on('resize', update);

        router = initializeRouter(state, update);

        updateWithRoute = union(update, updateRoute.bind(undefined, state, router));

        createControls($('.allControlsContainer'), state, updateWithRoute);
        createLegend($('.legendContainer'), data, state, updateWithRoute);

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
                })
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
            'ajax.googleapis.com': 'developers.google.com/speed/libraries/'
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

    function createControls($p, state, update) {
        createTypes($p, state, update);
        createAmounts($p, state, update);
    }

    function createTypes($p, state, update) {
        $controls($p, state, update, 'type', ['ping', 'http', 'https'], 'ping');
    }

    function createAmounts($p, state, update) {
        $controls($p, state, update, 'amount', [7, 14, 30, 90], 30);
    }

    function $controls($p, state, update, type, items, selected) {
        var $e = $('<div>',
            {'class': 'controlsContainer ' + (type + 's')}).appendTo($p);
        items.forEach($control.bind(undefined, $e, state, type, update));

        if(!state[type]) {
            $('.' + selected, $e).addClass('selected');
            state[type] = selected;
        }
    }

    function $control($p, state, type, update, name) {
        var $e = $('<a>', {'class': 'control ' + type + ' ' + name, href: '#'}).
                text(name).on('click', function(e) {
            e.preventDefault();

            $e.siblings().removeClass('selected').removeClass('label');
            $e.addClass('selected label');

            state[type] = name;

            update();
        }).appendTo($p);

        if(state[type] == name) $e.addClass('selected');
    }

    function updateAll($p, data, state) {
        updateCharts($p, data, state);
        updateLegend($p, data, state);
    }

    function updateCharts($p, data, state) {
        updateChart($('.uptimeContainer'), data, state, 'uptime', 100, function(v) {
            var val = ((100 - v.value) / 100 * 60 * 24).toFixed(2);

            v.value += ' %, ' + val + ' min downtime';

            return v;
        });
        updateChart($('.latencyContainer'), data, state, 'latency', 300, function(v) {
            v.value += ' ms';

            return v;
        });
    }

    function updateChart($p, data, state, category, height, tooltipCb) {
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

            $('.' + type + '.' + tdClass).text(value);
        }
    }

    function chart(ctx, data, tooltipCb) {
        // https://github.com/nnnick/Chart.js/issues/76
        var min = minimum(data.datasets.map(op(minimum, prop('data'))));
        var max = maximum(data.datasets.map(op(maximum, prop('data'))));
        var opts;

        if(max == min) {
            opts = {
                animation: true,
                animationSteps: 10,
                datasetFill: false,
                scaleOverride : true,
                scaleSteps : 3,
                scaleStepWidth : 1,
                scaleStartValue : max - 3
            };
        }
        else {
            opts = {
                animation: true,
                animationSteps: 10,
                datasetFill: false,
                pointDot: true,
                scaleShowGridLines: true,
                scaleGridLineColor: 'rgba(224,224,224,0.5)',
                scaleGridLineWidth: 1,
                pointDotRadius: 3,
                bezierCurve: false
            };
        }

        new Chart(ctx, {}, tooltipCb).Line(data, opts);
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

        createRow(state, providers, 'latency', 'ms').appendTo($table);
        createRow(state, providers, 'uptime', '%').appendTo($table);
    }

    function createTh(state, name, host, color, update) {
        var thClass = idfy(name);
        var $e = $('<th>', {'class': 'cdn ' + thClass}).css({
            'background-color': colorToHex(color)
        });
        var inverseColor = colorToHex(flipColor(color));
        $('<a>', {href: 'http://' + host}).css({
            'color': inverseColor
        }).text(name).appendTo($e);

        var $icon = $('<i>', {'class': 'visibility foundicon-eyeball'}).css({
            'color': inverseColor
        }).on('click', function() {
            $icon.toggleClass('selected');

            toggleItem(state.providers, idfy(name), $icon.hasClass('selected'));

            update();
        }).appendTo($e);

        if(within(state.providers, thClass)) $icon.addClass('selected');

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

    function createRow(state, providers, type, unit) {
        var $row = $('<tr>');
        var name, provider, values, value, tdClass;

        $('<td>', {'class': type}).text(type).appendTo($row);

        for(name in providers) {
            provider = providers[name];
            tdClass = idfy(name);

            $('<td>', {'class': type + ' ' + tdClass}).appendTo($row);
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

            ret.push(d.toString('dd MMM'));
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
        // TODO: maybe there's a better way? now it skips the contribution of
        // the neighboring days
        if(amount == 90) return everyNth(3, data);

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
        var brightness = (color[0] * 299 + color[1] * 587 + color[2] * 114) / 1000;

        if(brightness > 125) return [0, 0, 0];

        return [255, 255, 255];
    }

    function colorToHex(color) {
        return '#' + color.map(function(v) {
            return v.toString(16);
        }).join('');
    }

    function getColor(index) {
        return [
            [216, 79, 68],
            [174, 227, 214],
            [243, 213, 162],
            [93, 150, 215],
            [68, 68, 68],
            [227, 136, 235],
            [170, 221, 94]
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

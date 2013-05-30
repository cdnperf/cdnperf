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

        createCdns($('.cdns'), state, data.providers, updateWithRoute);
        createControls($('.allControlsContainer'), state, updateWithRoute);

        initializeControls(state);
    });

    function union() {
        var args = arguments;

        return function() {
            for(var i = 0; i < args.length; i++) {
                args[i]();
            }
        }
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

        router.navigate('/' + providers + '/' + type + '/' + amount, {replace: true});
    }

    function initializeState(data) {
        return {
            type: '',
            amount: '',
            providers: Object.keys(data).map(idfy)
        };
    }

    function initializeControls(state) {
        var $e, k, v;

        for(k in state) {
            v = state[k];

            if(Array.isArray(v)) {
                v.forEach(function(a) {
                    $e = $('.cdn.' + a);

                    if($e.length) $e.trigger('click');
                })
            }
            else {
                $e = v && $('.control.' + k + '.' + v) || '';
                if($e.length) $e.trigger('click');
                else $('.control.' + k + ':last').trigger('click');
            }
        }
    }

    function groupData(data) {
        var providers = {};

        data.providers.forEach(function(v) {
            var name = getProviderName(v.name);

            if(!(name in providers)) providers[name] = {};
            if(!(v.type in providers[name])) providers[name][v.type] = {
                latency: v.latency,
                uptime: v.uptime
            };
        });

        return {
            providers: providers,
            firstDate: new XDate(data.firstDate * 1000),
            lastDate: new XDate(data.lastDate * 1000)
        }
    }

    function toFixed(a) {
        return function(v) {
            return parseFloat(v.toFixed(a), 10);
        };
    }

    function attachColors(data) {
        var i = 0;

        for(var name in data.providers) {
            data.providers[name]._color = getColor(i);

            i++;
        }

        return data;
    }

    function createCdns($p, state, providers, update) {
        Object.keys(providers).forEach(function(name) {
            var $e = $('<a>', {'class': 'cdn ' + idfy(name), href: '#'}).text(name).appendTo($p).on('click', function(e) {
                e.preventDefault();

                $e.toggleClass('selected');

                toggleItem(state.providers, idfy(name), $e.hasClass('selected'));

                update();
            });
        });
    }

    function idfy(val) {
        return val.toLowerCase().replace(/[ \-\(\)]+/g, '_').replace(/\.+/g, '');
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

    function createControls($p, state, update) {
        createTypes($p, state, update);
        createAmounts($p, state, update);
    }

    function createTypes($p, state, update) {
        $controls($p, state, update, 'types', 'type', ['ping', 'http', 'https']);
    }

    function createAmounts($p, state, update) {
        // TODO: replace with a slider?
        $controls($p, state, update, 'amounts', 'amount', [7, 14, 30]);
    }

    function $controls($p, state, update, containerClass, itemClass, items) {
        var $e = $('<div>',
            {'class': 'controlsContainer ' + containerClass}).appendTo($p);
        items.forEach($control.bind(undefined, $e, state, itemClass, update));
    }

    function $control($p, state, type, update, name) {
        var $e = $('<a>', {'class': 'control ' + type + ' ' + name, href: '#'}).text(name).on('click', function(e) {
            e.preventDefault();

            $e.siblings().removeClass('selected').removeClass('label');
            $e.addClass('selected label');

            state[type] = name;

            update();
        }).appendTo($p);
    }

    function updateAll($p, data, state) {
        updateCharts($p, data, state);
        updateLegend($p, data.providers, state);
    }

    function updateCharts($p, data, state) {
        var $container = $('.chartContainer');

        updateChart($container, data, state, 'uptime', 100);
        updateChart($container, data, state, 'latency', 300)
    }

    function updateChart($p, data, state, category, height) {
        var $canvas = $('.' + category + 'Chart:first');
        var ctx, width;

        if(!$canvas.length) {
            $('<h2>').text(category).appendTo($p);
            $canvas = $('<canvas>', {'class': category + 'Chart'}).appendTo($p);
        }

        // dynamic width (parent width might change) 
        width = $canvas.parent().width();

        $canvas.attr({width: width, height: height});

        var ctx = $canvas[0].getContext('2d');

        chart(ctx, getData(data, state, category))
    }

    function chart(ctx, data) {
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
            }
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

        new Chart(ctx).Line(data, opts);
    }

    function op(fn, accessor) {
        return function(v) {
            return fn(accessor(v));
        };
    }

    function minimum(a) {
        return a.sort()[0];
    }

    function maximum(a) {
        return a.sort()[a.length - 1];
    }

    function updateLegend($p, providers, state) {
        var $table = $('table.legend:first');
        var provider, color, $header, $container;

        if(!$table.length) {
            $container = $('.legendContainer');

            $table = $('<table>', {'class': 'legend'}).appendTo($container);
        }

        $table.empty();

        $header = $('<tr>').appendTo($table);

        $('<th>', {'class': 'colorLegend'}).appendTo($header);
        $('<th>', {'class': 'cdn'}).text('CDN').appendTo($header);
        $('<th>', {'class': 'latency'}).text('latency').appendTo($header);
        $('<th>', {'class': 'uptime'}).text('uptime').appendTo($header);

        for(var name in providers) {
            provider = providers[name];
            color = provider._color;

            if(within(state.providers, idfy(name))) {
                var $row = $('<tr>').appendTo($table);

                $('<td>', {'class': 'color'}).css('background-color',
                    color).appendTo($row);
                $('<td>', {'class': 'name'}).text(name).appendTo($row);

                ['latency', 'uptime'].forEach(function(category) {
                    var values, value;

                    if(state.type in provider) {
                        values = provider[state.type][category];

                        if(values) value = average(values.slice(-state.amount)).toFixed(1);
                        if(category == 'latency') value += ' ms';
                        if(category == 'uptime') value += ' %';
                    }
                    else {
                        value = 'NA';
                    }

                    $('<td>', {'class': 'value'}).text(value).appendTo($row);
                });
            }
        }
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
        var i, d;

        for(i = 0; i < amount; i++) {
            d = lastDate.clone();

            d.addDays(-(amount - i - 1));

            ret.push(d.toString('dd MMM'));
        }

        return ret;
    }

    function getDatasets(providers, state, category) {
        var ret = [];
        var provider, color, data, offset;

        for(var name in providers) {
            provider = providers[name];
            color = provider._color;

            if(!within(state.providers, idfy(name))) continue;
            if(!(state.type in provider)) continue;
            if(!(category in provider[state.type])) continue;

            data = provider[state.type][category];

            offset = state.amount - data.length;
            if(offset > 0) data = zeroes(offset).concat(data);
            else data = data.slice(-state.amount);

            ret.push({
                strokeColor: color,
                pointColor: color,
                pointStrokeColor: color,
                data: data
            });
        }

        return ret;
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

    function getColor(index) {
        return [
            '#d84f44',
            '#aee3d6',
            '#f3d5a2',
            '#5d96d7',
            '#444',
            '#e388eb',
            '#aadd5e'
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

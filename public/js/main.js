$(main);

function main() {
    $.getJSON('./data.json', function(d) {
        var data = attachColors(groupData(d));
        var state = initializeState(data);
        var update = updateAll.bind(undefined, $('.content.row'), data, state);

        $(window).on('resize', update);

        createCdns($('.cdns'), state, data, update);
        createControls($('.controls.row'), state, update);

        initializeControls(state);
    });

    function initializeState(data) {
        return overlay({
            type: '',
            amount: '',
            providers: Object.keys(data).map(idfy)
        }, qsToObject());
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

    function overlay(a, b) {
        var ret = {};

        for(var k in a) ret[k] = k in b? b[k]: a[k];

        return ret;
    }

    function qsToObject() {
        var search = window.location.search;
        var ret;

        if(!search) return {};

        return parseArrays(zipToObject(search.slice(1).split('&').map(op('split', '='))));
    }

    function op(name, param) {
        return function(a) {
            return a[name](param);
        };
    }

    function parseArrays(o) {
        var ret = {};

        for(var k in o) ret[k] = parseArray(o[k]);

        return ret;
    }

    function parseArray(str) {
        if(first(str) == '[' && last(str) == ']') return str.slice(1, -1).split(',');

        return str;
    }

    function first(a) {
        return a[0];
    }

    function last(a) {
        return a[a.length - 1];
    }

    function zipToObject(z) {
        var ret = {};

        z.forEach(function(v) {
            ret[v[0]] = v[1];
        });

        return ret;
    }

    function groupData(data) {
        var ret = {};

        Object.keys(data).forEach(function(type) {
            var name;

            data[type].forEach(function(v) {
                var d = v.data;

                name = getProviderName(v.name);

                if(!(name in ret)) ret[name] = {};
                if(!(v.type in ret[name])) ret[name][v.type] = {};

                if(type == 'uptime') {
                    d = d.map(function(v) {
                        return v * 100;
                    });
                }

                d = d.map(toFixed(2));

                ret[name][v.type][type] = d.reverse(); /* from oldest to newest */
            });
        });

        return ret;
    }

    function toFixed(a) {
        return function(v) {
            return parseFloat(v.toFixed(a), 10);
        };
    }

    function attachColors(data) {
        var i = 0;

        for(var name in data) {
            data[name]._color = getColor(i);

            i++;
        }

        return data;
    }

    function createCdns($p, state, data, update) {
        Object.keys(data).forEach(function(name) {
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
        $controls($p, state, update, 'amounts', 'amount', [7, 14]);
    }

    function $controls($p, state, update, containerClass, itemClass, items) {
        var $e = $('<div>',
            {'class': 'small-12 large-4 columns controlsContainer ' + containerClass}).appendTo($p);
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
        updateLegend($p, data, state);
    }

    function updateCharts($p, data, state) {
        var $container = $('.chartContainer:first');

        if(!$container.length) {
            $container = $('<div>',
                {'class': 'chartContainer small-12 large-8 columns'}).appendTo($p);
        }

        updateChart($container, data, state, 'uptime', 100);
        updateChart($container, data, state, 'latency', 300)
    }

    function updateChart($p, data, state, category, height) {
        var $canvas = $('.' + category + 'Chart:first');
        var ctx, width;

        if(!$canvas.length) {
            $canvas = $('<canvas>', {'class': category + 'Chart'}).appendTo($p);
        }

        width = $canvas.parent().width();

        $canvas.attr({width: width, height: height});

        var ctx = $canvas[0].getContext('2d');
        new Chart(ctx).Line(getData(data, state, category), {
            datasetFill: false,
            animation: true,
            animationSteps: 45,
	        pointDot: true,
	        scaleShowGridLines: true,
            scaleGridLineColor: 'rgba(224,224,224,0.5)',
	        scaleGridLineWidth: 1,	
	        pointDotRadius: 3,
	        bezierCurve: false
        });
    }

    function updateLegend($p, data, state) {
        var $table = $('table.legend:first');
        var provider, color, $e, $header;

        if(!$table.length) {
            $e = $('<div>',
                {'class': 'legendContainer small-12 large-4 columns'}).appendTo($p);

            $table = $('<table>', {'class': 'legend'}).appendTo($e);
        }

        $table.empty();

        $header = $('<tr>').appendTo($table);

        $('<th>', {'class': 'colorLegend'}).appendTo($header);
        $('<th>', {'class': 'cdn'}).text('CDN').appendTo($header);
        $('<th>', {'class': 'latency'}).text(title('latency')).appendTo($header);
        $('<th>', {'class': 'uptime'}).text(title('uptime')).appendTo($header);

        for(var name in data) {
            provider = data[name];
            color = provider._color;

            if(within(state.providers, idfy(name)) && state.type in provider) {
                var $row = $('<tr>').appendTo($table);

                $('<td>', {'class': 'color'}).css('background-color',
                    color).appendTo($row);
                $('<td>', {'class': 'name'}).text(name).appendTo($row);

                ['latency', 'uptime'].forEach(function(category) {
                    var values = provider[state.type][category];
                    var value;

                    if(values) value = average(values.slice(-state.amount)).toFixed(1);
                    if(category == 'latency') value += ' ms';
                    if(category == 'uptime') value += ' %';

                    $('<td>', {'class': 'value'}).text(value).appendTo($row);
                });
            }
        }
    }

    function title(a) {
        if(!a) return;

        return a[0].toUpperCase() + a.slice(1);
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
            labels: getLabels(state.amount),
            datasets: getDatasets(data, state, category)
        };
    }

    function getLabels(amount) {
        var ret = [];
        var i, d;

        for(i = 0; i < amount; i++) {
            d = new XDate();

            d.addDays(-(amount - i - 1));

            ret.push(d.toString('dd MMM'));
        }

        return ret;
    }

    function getDatasets(data, state, category) {
        var ret = [];
        var provider, color;

        for(var cdn in data) {
            provider = data[cdn];
            color = provider._color;

            if(!within(state.providers, idfy(cdn))) continue;
            if(!(state.type in data[cdn])) continue;
            if(!(category in data[cdn][state.type])) continue;

            ret.push({
                strokeColor: color,
                pointColor: color,
                pointStrokeColor: color,
                data: data[cdn][state.type][category].slice(-state.amount)
            });
        }

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

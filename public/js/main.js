$(main);

function main() {
    $.getJSON('./data.json', function(d) {
        var data = attachColors(groupData(d));
        var state = {
            type: '',
            category: '',
            amount: ''
        };
        var update = updateAll.bind(undefined, $('.content.row'), data, state);

        $(window).on('resize', update);

        createControls($('.controls.row'), state, update);
        $('.controlsContainer .control:last-child').trigger('click');
        $('.types .control:first').trigger('click');
        update();
    });

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

    function createControls($p, state, update) {
        createTypes($p, state, update);
        createAmounts($p, state, update);
        createCategories($p, state, update);
    }

    function createTypes($p, state, update) {
        $controls($p, state, update, 'types', 'type', ['ping', 'http', 'https']);
    }

    function createAmounts($p, state, update) {
        // TODO: replace with a slider?
        $controls($p, state, update, 'amounts', 'amount', [7, 14]);
    }

    function createCategories($p, state, update) {
        $controls($p, state, update, 'categories', 'category', ['latency', 'uptime']);
    }

    function $controls($p, state, update, containerClass, itemClass, items) {
        var $e = $('<div>',
            {'class': 'small-12 large-4 columns controlsContainer ' + containerClass}).appendTo($p);
        items.forEach($control.bind(undefined, $e, state, itemClass, update));
    }

    function $control($p, state, type, update, name) {
        var $e = $('<a>', {'class': 'control ' + type, href: '#'}).text(name).on('click', function(e) {
            e.preventDefault();

            $e.siblings().removeClass('selected').removeClass('label');
            $e.addClass('selected label');

            state[type] = name;

            update();
        }).appendTo($p);
    }

    function updateAll($p, data, state) {
        updateChart($p, data, state);
        updateLegend($p, data, state);
    }

    function updateChart($p, data, state) {
        var $c = $('canvas.chart:first');
        var height = 400;
        var $e, width;

        if(!$c.length) {
            $e = $('<div>',
                {'class': 'canvasContainer small-12 large-9 columns'}).appendTo($p);

            $c = $('<canvas>', {'class': 'chart'}).appendTo($e);
        }

        width = $c.parent().width();

        $c.attr({width: width, height: height});

        var ctx = $c[0].getContext('2d');
        new Chart(ctx).Line(getData(data, state), {
            datasetFill: false,
            animation: true,
            animationSteps : 45,
	    pointDot : true,
	    scaleShowGridLines: true,
            scaleGridLineColor : "rgba(224,224,224,0.5)",
	    scaleGridLineWidth : 1,	
	    pointDotRadius : 3,
	    bezierCurve: false
        });
    }

    function updateLegend($p, data, state) {
        var $table = $('table.legend:first');
        var provider, color, $e, $header;

        if(!$table.length) {
            $e = $('<div>',
                {'class': 'legendContainer small-12 large-3 columns'}).appendTo($p);

            $table = $('<table>', {'class': 'legend'}).appendTo($e);
        }

        $table.empty();

        $header = $('<tr>').appendTo($table);

        $('<th>', {'class': 'colorLegend'}).appendTo($header);
        $('<th>', {'class': 'cdn'}).text('CDN').appendTo($header);
        $('<th>', {'class': 'category'}).text(title(state.category)).appendTo($header);

        for(var name in data) {
            provider = data[name];
            color = provider._color;

            if(state.type in provider) {
                var $row = $('<tr>').appendTo($table);
                var lowerName = name.toLowerCase();
                var values = provider[state.type][state.category];
                var value;

                if(values) value = average(values.slice(-state.amount)).toFixed(3);
                if(state.category == 'latency') value += ' ms';
                if(state.category == 'uptime') value += ' %';

                $('<td>', {'class': 'color ' + lowerName}).css('background-color',
                    color).appendTo($row);
                $('<td>', {'class': 'name ' + lowerName}).text(name).appendTo($row);
                $('<td>', {'class': 'value ' + lowerName}).text(value).appendTo($row);
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

    function getData(data, state) {
        return {
            labels: getLabels(state.amount),
            datasets: getDatasets(data, state)
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

    function getDatasets(data, state) {
        var ret = [];
        var color;

        for(var cdn in data) {
            color = data[cdn]._color;

            if(!(state.type in data[cdn])) continue;
            if(!(state.category in data[cdn][state.type])) continue;

            ret.push({
                strokeColor: color,
                pointColor: color,
                pointStrokeColor: color,
                data: data[cdn][state.type][state.category].slice(-state.amount)
            });
        }

        return ret;
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

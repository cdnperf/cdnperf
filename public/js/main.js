$(main);

function main() {
    var type = 'ping';
    var category = 'latency';
    var range = 3;
    var data;

    $.getJSON('./data.json', function(d) {
        var update = updateAll.bind(undefined, $('.content.row'));

        data = attachColors(groupData(d));

        $(window).on('resize', update);

        createControls($('.controls.row'), data);
        update();
    });

    function groupData(data) {
        var ret = {};

        Object.keys(data).forEach(getData);

        function getData(type) {
            var name;

            data[type].forEach(function(v) {
                name = getProviderName(v.name);

                if(!(name in ret)) ret[name] = {};
                if(!(v.type in ret[name])) ret[name][v.type] = {};

                ret[name][v.type][type] = v.data;
            });
        }

        return ret;
    }

    function attachColors(data) {
        var i = 0;

        for(var name in data) {
            data[name]._color = getColor(i);

            i++;
        }

        return data;
    }

    function createControls($p, data) {
        createTypes($p, data);
        createRanges($p, data);
        createCategories($p, data);
    }

    function createTypes($p, data) {
        // TODO: rewrite to be generated based on data
        $controls($p, 'types', 'type', {
            'ping': function() {
                type = 'ping';

                updateAll($p)
            },
            'http': function() {
                type = 'http';

                updateAll($p);
            },
            'https': function() {
                type = 'https';

                updateAll($p);
            }
        });
    }

    function createRanges($p, data) {
        // TODO: replace with a slider?
        $controls($p, 'ranges', 'range', {
            '3 days': function() {
                range = 3;

                updateAll($p);
            },
            '7 days': function() {
                range = 7;

                updateAll($p);
            },
            '14 days': function() {
                range = 14;

                updateAll($p);
            }
        });
    }

    function createCategories($p, data) {
        // TODO: generate based on data
        $controls($p, 'categories', 'category', {
            'latency': function() {
                category = 'latency';

                updateAll($p);
            },
            'uptime': function() {
                category = 'uptime';

                updateAll($p);
            }
        });
    }

    function $controls($p, containerClass, itemClass, controls) {
        var $e = $('<div>', {'class': 'small-12 large-4 columns controlsContainer ' + containerClass}).appendTo($p);

        for(var control in controls) $control($e, itemClass, control, controls[control]);

        $('.control', $e).first().addClass('selected label');
    }

    function $control($p, type, name, handler) {
        var $e = $('<a>', {'class': 'control ' + type, href: '#'}).text(name).on('click', function(e) {
            e.preventDefault();

            $e.siblings().removeClass('selected').removeClass('label');
            $e.addClass('selected label');

            handler(e);
        }).appendTo($p);
    }

    function updateAll($p) {
        updateChart($p);
        updateLegend($p);
    }

    function updateChart($p) {
        var $c = $('canvas.chart:first');
        var height = 400;
        var $e, width;

        if(!$c.length) {
            $e = $('<div>',
                {'class': 'canvasContainer small-12 large-10 columns'}).appendTo($p);

            $c = $('<canvas>', {'class': 'chart'}).appendTo($e);
        }

        width = $c.parent().width();

        $c.attr({width: width, height: height});

        var ctx = $c[0].getContext('2d');
        new Chart(ctx).Line(getData(), {
            datasetFill: false,
            animation: false
        });
    }

    function updateLegend($p) {
        var $table = $('table.legend:first');
        var $header = $('<tr>').appendTo($table);
        var provider, color, $e;

        if(!$table.length) {
            $e = $('<div>',
                {'class': 'legendContainer small-12 large-2 columns'}).appendTo($p);

            $table = $('<table>', {'class': 'legend'}).appendTo($e);
        }

        $table.empty();

        $('<th>', {'class': 'colorLegend'}).appendTo($header);
        $('<th>', {'class': 'cdn'}).text('CDN').appendTo($header);
        $('<th>', {'class': 'category'}).text('Latency').appendTo($header);

        for(var name in data) {
            provider = data[name];
            color = provider._color;

            if(type in provider) {
                var $row = $('<tr>').appendTo($table);
                var lowerName = name.toLowerCase();

                $('<td>', {'class': 'color ' + lowerName}).css('background-color',
                    color).appendTo($row);
                $('<td>', {'class': 'name ' + lowerName}).text(name).appendTo($row);
                $('<td>', {'class': 'value ' + lowerName}).appendTo($row);
            }
        }
    }

    function getData() {
        return {
            labels: getLabels(data, range),
            datasets: getDatasets(data, range)
        };
    }

    function getLabels(data, amount) {
        var ret = [];
        var i;

        for(i = 0; i < range; i++) ret.push(i);

        return ret;
    }

    function getDatasets(data, amount) {
        var ret = [];
        var color;

        for(var cdn in data) {
            color = data[cdn]._color;

            if(!(type in data[cdn])) continue;
            if(!(category in data[cdn][type])) continue;

            ret.push({
                strokeColor: color,
                pointColor: color,
                pointStrokeColor: color,
                data: data[cdn][type][category].slice(-amount)
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

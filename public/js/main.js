$(main);

function main() {
    var type = 'ping';
    var category = 'latency';
    var range = 3;
    var data;

    // TODO: load json based on control status (types, ranges, categories)
    // TODO: figure out how to deal with this (file for each permutation?)
    $.getJSON('./data.json', function(d) {
        var $e = $('.latencies');

        data = d;

        createControls($e);
        updateChart($e);
        createLegend($e, data.latency);
    });

    function createControls($p) {
        var $e = $('<div>', {'class': 'controls'}).appendTo($p);

        createTypes($e);
        createRanges($e);
        createCategories($e);
    }

    function createTypes($p, data) {
        $controls($p, 'types', 'type', {
            'ping': function() {
                type = 'ping';

                updateChart($p);
            },
            'http': function() {
                type = 'http';

                updateChart($p);
            },
            'https': function() {
                type = 'https';

                updateChart($p);
            }
        });
    }

    function createRanges($p, data) {
        $controls($p, 'ranges', 'range', {
            '3 days': function() {
                range = 3;

                updateChart($p);
            },
            '7 days': function() {
                range = 7;

                updateChart($p);
            }/*,
            '30 days': function() {
                console.log('change to 30 days view');
            }*/
        });
    }

    function createCategories($p, data) {
        $controls($p, 'categories', 'category', {
            'latency': function() {
                category = 'latency';

                updateChart($p);
            },
            'uptime': function() {
                category = 'uptime';

                updateChart($p);
            }
        });
    }

    function $controls($p, containerClass, itemClass, controls) {
        var $e = $('<div>', {'class': 'controlsContainer ' + containerClass}).appendTo($p);

        for(var control in controls) $control($e, itemClass, control, controls[control]);

        $('.control', $e).first().addClass('selected');
    }

    function $control($p, type, name, handler) {
        var $e = $('<a>', {'class': 'panel control ' + type, href: '#'}).text(name).on('click', function(e) {
            e.preventDefault();

            $e.siblings().removeClass('selected');
            $e.addClass('selected');

            handler(e);
        }).appendTo($p);
    }

    function updateChart($p) {
        var $c = $('canvas.chart:first');

        if(!$c.length) $c = $('<canvas>', {'class': 'chart'}).attr({width: 1000, height: 400}).appendTo($p);

        var ctx = $c[0].getContext('2d');
        new Chart(ctx).Line(getData(), {
            datasetFill: false
        });
    }

    function createLegend($p, data) {
        var providerNames = getProviderNames(data).sort();
        var $table = $('<table>', {'class': 'legend'}).appendTo($p);
        var $header = $('<tr>').appendTo($table);

        $('<th>', {'class': 'colorLegend'}).appendTo($header);
        $('<th>', {'class': 'cdn'}).text('CDN').appendTo($header);
        $('<th>', {'class': 'category'}).text('Latency').appendTo($header);

        providerNames.map(function(name) {
            var $row = $('<tr>').appendTo($table);
            var lowerName = name.toLowerCase();

            $('<td>', {'class': 'color ' + lowerName}).css('background-color', getColor(lowerName)).appendTo($row);
            $('<td>', {'class': 'name ' + lowerName}).text(name).appendTo($row);
            $('<td>', {'class': 'value ' + lowerName}).appendTo($row);
        });
    }

    function getData() {
        var d = data[category];

        return {
            labels: getLabels(d, range),
            datasets: getDatasets(d, range)
        };
    }

    function getProviderNames(data) {
        return unique(data.map(prop('name')).map(getProviderName));
    }

    function getLabels(d, amount) {
        return d[0].data.slice(-amount).map(function(v, i) {return i;});
    }

    function getDatasets(data, amount) {
        var pointColor = '#222';

        return data.filter(function(d) {
            return d.type == type;
        }).map(function(d) {
            return {
                strokeColor: getColor(getProviderName(d.name)),
                pointColor: pointColor,
                pointStrokeColor: pointColor,
                data: d.data.slice(-amount)
            };
        });
    }

    function getProviderName(fullname) {
        return fullname.split(' ')[0];
    }

    function getColor(name) {
        if(!name) return console.warn('getColor is missing name parameter');

        name = name.toLowerCase();
        var colors = {
            jsdelivr: '#b00',
            yandex: 'green',
            microsoft: 'blue',
            cdnjs: '#c64012',
            google: '#333',
            'jquery(mt)': 'red'
        };

        if(name in colors) return colors[name];

        console.warn('Failed to get a color for ', name);
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

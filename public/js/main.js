$(main);

function main() {
    // TODO: load json based on control status (types, ranges, categories)
    // TODO: figure out how to deal with this (file for each permutation?)
    $.getJSON('./data.json', function(data) {
        var $e = $('.latencies');

        console.log(data);

        createControls($e, data);
        updateChart($e, data.latency);
        createLegend($e, data.latency);
    });

    function createControls($p, data) {
        var $e = $('<div>', {'class': 'controls'}).appendTo($p);

        createTypes($e, data);
        createRanges($e, data);
        createCategories($e, data);
    }

    function createTypes($p, data) {
        $controls($p, 'types', 'type', {
            'ping': function() {
                console.log('should show ping now');
            },
            'http': function() {
                console.log('should show http now');
            },
            'https': function() {
                console.log('should show https now');
            }
        });
    }

    function createRanges($p, data) {
        $controls($p, 'ranges', 'range', {
            '1 day': function() {
                console.log('change to 1 day view');
            },
            '7 days': function() {
                console.log('change to 7 days view');
            }/*,
            '30 days': function() {
                console.log('change to 30 days view');
            }*/
        });
    }

    function createCategories($p, data) {
        $controls($p, 'categories', 'category', {
            'latency': function() {
                updateChart($p, data.latency);
            },
            'uptime': function() {
                updateChart($p, data.uptime);
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

    function updateChart($p, data) {
        var $c = $('canvas.chart:first');

        if(!$c.length) $c = $('<canvas>', {'class': 'chart'}).attr({width: 1000, height: 400}).appendTo($p);

        var ctx = $c[0].getContext('2d');
        var d = getData(data);
        var options = {
            datasetFill: false
        };

        new Chart(ctx).Line(d, options);
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

    function getData(data) {
        return {
            labels: getLabels(data),
            datasets: getDatasets(data)
        };
    }

    function getProviderNames(data) {
        return unique(data.map(prop('name')).map(getProviderName));
    }

    function getLabels(data) {
        return data[0].data.map(function(v, i) {return i;});
    }

    function getDatasets(data) {
        var pointColor = '#222';

        return data.map(function(d) {
            return {
                strokeColor: getColor(getProviderName(d.name)),
                pointColor: pointColor,
                pointStrokeColor: pointColor,
                data: d.data
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

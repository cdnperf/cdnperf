$(main);

function main() {
    // TODO: load json based on control status (types, ranges, categories)
    // TODO: figure out how to deal with this (file for each permutation?)
    $.getJSON('./data.json', function(providers) {
        var $e = $('.latencies');

        createControls($e);
        createChart($e, providers);
        createLegend($e, providers);
    });

    function createControls($p) {
        var $e = $('<div>', {'class': 'controls'}).appendTo($p);

        createTypes($e);
        createRanges($e);
        createCategories($e);
    }

    function createTypes($p) {
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

    function createRanges($p) {
        $controls($p, 'ranges', 'range', {
            '1 day': function() {
                console.log('change to 1 day view');
            },
            '7 days': function() {
                console.log('change to 7 days view');
            },
            '30 days': function() {
                console.log('change to 30 days view');
            }
        });
    }

    function createCategories($p) {
        $controls($p, 'categories', 'category', {
            'latency': function() {
                console.log('change to latency view');
            },
            'uptime': function() {
                console.log('change to uptime view');
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

    function createChart($p, providers) {
        var $c = $('<canvas>', {'class': 'chart'}).attr({width: 750, height: 400}).appendTo($p);
        var ctx = $c[0].getContext('2d');
        var data = getData(providers);
        var options = {
            datasetFill: false
        };

        new Chart(ctx).Line(data, options);
    }

    function createLegend($p, providers) {
        var providerNames = getProviderNames(providers).sort();
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

    function getData(providers) {
        return {
            labels: getLabels(providers),
            datasets: getDatasets(providers)
        };
    }

    function getProviderNames(providers) {
        return unique(providers.map(prop('name')).map(getProviderName));
    }

    function getLabels(providers) {
        return providers[0].data.map(prop('x'));
    }

    function getDatasets(providers) {
        var pointColor = '#222';

        return providers.map(function(provider) {
            return {
                strokeColor: getColor(getProviderName(provider.name)),
                pointColor: pointColor,
                pointStrokeColor: pointColor,
                data: provider.data.map(prop('y'))
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

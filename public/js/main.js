$(main);

function main() {
    $.getJSON('./data.json', function(providers) {
        var $c = $('.latencies');

        createChart($c, providers);
    });

    function createChart($c, providers) {
        var ctx = $c[0].getContext('2d');
        var data = getData(providers);
        var options = {
            datasetFill: false
        };

        new Chart(ctx).Line(data, options);
    }

    function getData(providers) {
        return {
            labels: getLabels(providers),
            datasets: getDatasets(providers)
        };
    }

    function getLabels(providers) {
        return providers[0].data.map(prop('x'));
    }

    function getDatasets(providers) {
        var pointColor = '#222';

        return providers.map(function(provider) {
            return {
                strokeColor: getColor(provider.name.split(' ')[0].toLowerCase()),
                pointColor: pointColor,
                pointStrokeColor: pointColor,
                data: provider.data.map(prop('y'))
            };
        });
    }

    function getColor(name) {
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

    function prop(name) {
        return function(v) {
            return v[name];
        };
    }
}

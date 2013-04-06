$(main);

function main() {
    $.getJSON('./data.json', function(providers) {
        var $p = $('.latencies');

        // TODO: add shim for older browsers
        providers.forEach(function(provider) {
            createChart($p, provider);
        });
    });

    function createChart($p, provider) {
        var d = {
            xScale: 'time',
            yScale: 'linear',
            type: 'line',
            main: [{
                className: 'latency',
                data: provider.data
            }]
        };
        // TODO: move to a template
        var $l = $('<div>', {'class': 'latency'}).appendTo($p);
        $('<div>', {'class': 'name'}).text(provider.name).appendTo($l);
        $('<div>', {'class': 'host'}).text(provider.host).appendTo($l);
        $('<div>', {'class': 'latency'}).text(provider.lastresponse + 'ms').appendTo($l);
        var $e = $('<figure>', {'class': 'chart'}).appendTo($l);

        new xChart('latency', d, $e.get(0));
    }
}

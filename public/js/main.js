$(main);

function main() {
    $.getJSON('./data.json', function(providers) {
        var $p = $('.latencies');

        createChart($p, providers);
    });

    function createChart($p, providers) {
        // TODO: figure out how many charts this can display at once
        new xChart('line-dotted', {
            xScale: 'time',
            yScale: 'linear',
            yMax: 100, // TODO: figure out a nice value for this, auto isn't that nice
            main: providers.map(function(p) {
                return {
                    className: '.latency',
                    data: p.data
                };
            })
        }, $('.chart').get(0));
    }
}

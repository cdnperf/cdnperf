$(main);

function main() {
    $.getJSON('./data.json', function(data) {
        var d = {
            xScale: 'time',
            yScale: 'linear',
            type: 'line',
            main: [{
                className: 'latency',
                data: data[0].data
            }]
        };

        new xChart('latency', d, '#myChart');
    });
}



function getFastest(data, type) {
    type = type || 'http';

    var result = [];

    data = data.filter(function(p) {
        return p.type == type;
    }).sort(function(a, b) {
        return last(a.latency) >= last(b.latency);
    }).map(function(v) {
        var parts = v.name.split(' ');

        return {
            name: parts.length > 1? parts.slice(0, -1).join(' '): parts.join(' '),
            latency: last(v.latency)
        };
    });

    return data;
}
exports.getFastest = getFastest;

function last(arr) {
    return arr[arr.length - 1];
}

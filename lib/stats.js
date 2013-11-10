

function getFastest(data, type) {
    type = type || 'http';

    var result = [];

    data = data.providers.filter(function(p) {
        return p.type == type;
    }).sort(function(a, b) {
        return last(a.latency) >= last(b.latency);
    }).map(function(v) {
        return {
            name: v.name.split(' ').slice(0, -1).join(' '),
            latency: last(v.latency)
        };
    });

    return data;
}
exports.getFastest = getFastest;

function last(arr) {
    return arr[arr.length - 1];
}

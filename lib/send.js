var stats = require('./stats');

module.exports = send;


function send(sender, data, cb) {
    var fastest = stats.getFastest(data);
    var message = 'Average HTTP latencies - ' + fastest.map(function(v) {
        return v.name + ' ' + v.latency + 'ms';
    }).join(', ');

    console.log('sending message ', message);

    sender(message, cb);
}

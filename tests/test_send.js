var send = require('../lib/send');


send(function(msg, cb) {
    console.log(msg);

    cb();
}, [{
    type: 'http',
    name: 'demo HTTP',
    latency: [100, 50, 100]
}, {
    type: 'http',
    name: 'another',
    latency: [150, 150, 150]
}], function(err) {
    console.log('done');
});
var fs = require('fs');

var Twitter = require('simple-twitter');

var config = require('../config').twitter;
var tweeter = new Twitter(config.key, config.secret,
    config.accessToken, config.accessTokenSecret);


module.exports = function sendMessage(cb) {
    fs.readFile('./public/data.json', {
        encoding: 'utf-8'
    }, function(err, data) {
        if(err) {
            return cb(err);
        }

        send(JSON.parse(data).providers, cb);
    });
};

function send(data, cb) {
    var fastest = getFastest(data);
    var message = 'Average HTTP latencies - ' + fastest.map(function(v) {
        return v.name + ' ' + v.latency + 'ms';
    }).join(', ');

    console.log('sending message ', message);

    tweeter.post('statuses/update', {
        status: message
    }, cb);
}

function getFastest(data, type) {
    type = type || 'http';

    data = data.filter(function(p) {
        return p.type === type;
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

function last(arr) {
    return arr[arr.length - 1];
}

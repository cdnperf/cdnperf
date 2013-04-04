var request = require('request');

function init(config) {
    var baseUrl = 'https://api.pingdom.com/api/2.0/';

    return {
        checks: checks.bind(undefined, config),
        results: results.bind(undefined, config)
    };
}
module.exports = init;

function checks(config, cb) {
    var url = 'https://api.pingdom.com/api/2.0/checks';

    request.get(url, {
        auth: config,
        headers: {
            'App-Key': config.appkey
        }
    }, function(err, res) {
        cb(err, JSON.parse(res.body).checks);
    });
}

function results(config, check, limit, cb) {
    var url = 'https://api.pingdom.com/api/2.0/results/' + check;

    request.get(url, {
        auth: config,
        headers: {
            'App-Key': config.appkey
        },
        qs: {
            limit: limit
        }
    }, function(err, res) {
        cb(err, JSON.parse(res.body).results);
    });
}

var request = require('request');

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
exports.checks = checks;

function results(config, check, limit, cb) {
    // TODO: results/<check number>?limit=n
}
exports.results = results;

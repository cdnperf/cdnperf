var request = require('request');

function getChecks(config, cb) {
    var url = 'https://api.pingdom.com/api/2.0/checks';

    request.get(url, {
        auth: config,
        headers: {
            'App-Key': config.appkey
        }
    }, cb);
}
exports.getChecks = getChecks;

function getResults(config, check, limit, cb) {
    // TODO: results/<check number>?limit=n
}
exports.getResults = getResults;

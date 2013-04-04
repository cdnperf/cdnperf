var async = require('async');

var pingdom = require('./pingdom');
var config = require('./config');


// TODO: https://npmjs.org/package/node-cache

// TODO: format the data in renderable form
function checks(limit, done) {
    var api = pingdom(config.pingdom);

    api.checks(function(err, checks) {
        if(err) return console.error(err);

        async.map(checks, function(check, cb) {
            api.results(function(err, results) {
                if(err) return cb(err);

                cb(null, {
                    check: check,
                    results: results
                });
            }, {
                target: check.id,
                qs: {
                    limit: limit
                }
            });
        }, done);
    });
}
exports.checks = checks;

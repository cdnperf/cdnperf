var async = require('async');

var pingdom = require('./pingdom');


function checks(config, limit, done) {
    var api = pingdom(config);

    api.checks(function(err, checks) {
        if(err) return console.error(err);

        async.map(checks, function(check, cb) {
            api.results(function(err, results) {
                if(err) return cb(err);

                cb(null, {
                    name: check.name,
                    host: check.hostname,
                    type: check.type,
                    lastresponse: check.lastresponsetime,
                    data: results.map(function(result) {
                        return {
                            x: result.time,
                            y: result.responsetime
                        };
                    })
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

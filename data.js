var pingdom = require('./pingdom');
var config = require('./config');


// TODO: https://npmjs.org/package/node-cache

// TODO: use pingdom api to access checks/results and format that data in a renderable form
function checks(limit, cb) {
    var api = pingdom(config.pingdom);

    api.checks(function(err, checks) {
        if(err) return console.error(err);

        // TODO: return checks and associated results now
        api.results(function(err, results) {
            if(err) return cb(err);

            cb(null, results);
        }, {
            target: checks[0].id,
            qs: {
                limit: limit
            }
        });
    });
}
exports.checks = checks;

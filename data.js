var async = require('async');
var prop = require('funkit').common.prop;
var is = require('annois');
require('date-utils');

var pingdom = require('./pingdom');


function dayAverageLatency(config, o, done) {
    var d;

    o.limit = 1000;
    o.to = o.date;
    delete o.date;

    d = o.to.clone();
    d.addDays(-1);

    o.from = d;

    checks(config, o, function(err, data) {
        if(err) return done(err);

        // TODO: calculate averages
        done(err, data.map(function(d) {
            var dataLen = 0;

            d.data = d.data.map(prop('y')).reduce(function(a, b) {
                if(is.number(a) && is.number(b)) {
                    dataLen++;

                    return a + b;
                }

                return a;
            }) / dataLen;

            return d;
        }));
    });
}
exports.dayAverageLatency = dayAverageLatency;

function checks(config, o, done) {
    var api = pingdom(config);

    api.checks(function(err, checks) {
        if(err) return console.error(err);
        if(!checks) return console.warn('Check your credentials!');

        async.map(checks, function(check, cb) {
            api.results(function(err, results) {
                if(err) return cb(err);
                if(!results) return cb(err, []);

                cb(null, {
                    name: check.name,
                    host: check.hostname,
                    type: check.name.split(' ')[1].toLowerCase(),
                    lastresponse: check.lastresponsetime,
                    data: results.map(function(result) {
                        return {
                            x: result.time * 1000, // s to ms
                            y: result.responsetime
                        };
                    })
                });
            }, {
                target: check.id,
                qs: {
                    limit: o.limit
                }
            });
        }, done);
    });
}
exports.checks = checks;

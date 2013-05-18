var async = require('async');
var prop = require('funkit').common.prop;
var not = require('funkit').functional.not;
var is = require('annois');
require('date-utils');

var pingdom = require('./pingdom');

module.exports = function(config) {
    var funcs = [
        dayAverageLatency,
        dayUptime,
        weekAverageLatency,
        weekUptime,
        monthAverageLatency,
        monthUptime,
        checks
    ];
    var ret = {};

    funcs.forEach(function(v) {
        ret[v.name] = v.bind(undefined, config);
    });

    return ret;
};

function dayAverageLatency(config, o, done) {
    dayTemplate(config, o, function(err, data) {
        done(err, data && data.map(function(d) {
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

function dayUptime(config, o, done) {
    dayTemplate(config, o, function(err, data) {
        done(err, data && data.map(function(d) {
            var downs = d.data.map(prop('y')).filter(not(is.number));
            var downsLen = downs.length;
            var dataLen = d.data.length;

            d.data = (dataLen - downsLen) / dataLen;

            return d;
        }));
    });
}

function weekAverageLatency(config, o, done) {

}

function weekUptime(config, o, done) {

}

function monthAverageLatency(config, o, done) {

}

function monthUptime(config, o, done) {

}

function dayTemplate(config, o, done) {
    var d;

    o.limit = 1000;
    o.to = o.date;
    delete o.date;

    d = o.to.clone();
    d.addDays(-1);

    o.from = d;

    checks(config, o, function(err, data) {
        if(err) return done(err);

        done(err, data);
    });
}

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

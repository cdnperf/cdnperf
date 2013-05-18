var async = require('async');
var funkit = require('funkit');
var prop = funkit.common.prop;
var not = funkit.functional.not;
var range = funkit.math.range;
var is = require('annois');
require('date-utils');

var pingdom = require('./pingdom');

module.exports = function(config) {
    return {
        monthLatency: getTemplate.bind(undefined, config, 30, dayLatency),
        monthUptime: getTemplate.bind(undefined, config, 30, dayUptime),
        weekLatency: getTemplate.bind(undefined, config, 7, dayLatency),
        weekUptime: getTemplate.bind(undefined, config, 7, dayUptime),
        dayLatency: dayLatency.bind(undefined, config),
        dayUptime: dayUptime.bind(undefined, config)
    };
};

function getTemplate(config, dayRange, fn, o, done) {
    async.parallel(generateFunctions(), function(err, data) {
        done(err, data.map(function(item) {
            return item.map(function(v) {
                v.data = [v.data];

                return v;
            });
        }).reduce(function(a, b) {
            return a.map(function(v, i) {
                v.data = v.data.concat(b[i].data);

                return v;
            });
        }));
    });

    function generateFunctions() {
        return range(dayRange).map(function(offset) {
            var date = offsetDay(o.date, -offset);

            return function(done) {
                fn(config, {
                    date: date
                }, done);
            };
        });
    }
}

function dayLatency(config, o, done) {
    dayTemplate(config, o, function(err, data) {
        done(err, data && data.map(function(d) {
            var dataLen = 0;

            d.data = d.data.map(prop('y')).reduce(function(a, b) {
                if(!is.number(a)) a = 0;
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

function dayTemplate(config, o, done) {
    var d;

    o.limit = 1000;
    o.to = o.date;
    delete o.date;

    o.from = dateToUnix(offsetDay(o.to, -1));
    o.to = dateToUnix(o.to);

    checks(config, o, function(err, data) {
        if(err) return done(err);

        done(err, data);
    });
}

function dateToUnix(date) {
    return parseInt(date.getTime() / 1000, 10);
}

function offsetDay(d, offset) {
    d = d.clone();
    d.addDays(offset);

    return d;
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
                    limit: o.limit,
                    from: o.from,
                    to: o.to
                }
            });
        }, done);
    });
}

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
        latency: getTemplate.bind(undefined, config, dayLatency),
        uptime: getTemplate.bind(undefined, config, dayUptime)
    };
};

function getTemplate(config, fn, o, done) {
    var dayRange = o.range || console.warn('Missing day range!');

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

            d.data = d.data.filter(function(d) {
                return d.status == 'up';
            }).map(prop('y'));

            if(d.data.length) {
                d.data = d.data.reduce(function(a, b) {
                    if(!is.number(a)) a = 0;
                    if(is.number(a) && is.number(b)) {
                        dataLen++;

                        return a + b;
                    }

                    return a;
                }) / dataLen;
            }
            else d.data = 0;

            return d;
        }));
    });
}

function dayUptime(config, o, done) {
    dayTemplate(config, o, function(err, data) {
        done(err, data && data.map(function(d) {
            var statuses = d.data.map(prop('status'));
            var ups = statuses.filter(equals('up')).length;
            var downs = statuses.filter(equals('down')).length;

            d.data = ups / (ups + downs);

            return d;
        }));
    });
}

function equals(a) {
    return function(v) {
        return a == v;
    };
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
                            y: result.responsetime,
                            status: result.status
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

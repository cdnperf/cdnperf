var fs = require('fs');
var path = require('path');

var async = require('async');

var config = require('../config');
var pingdom = require('pingdom-api')(config.pingdom);

require('date-utils');


module.exports = function(cb) {
    var to = Date.today();
    var from = to.clone().addMonths(-3);

    async.parallel([
        getDotcomData.bind(null, {
            from: from,
            to: to,
            auth: config.dotcom.auth
        }),
        getPingdomData.bind(null, {
            from: from,
            to: to
        }),
    ], function(err, data) {
        if(err) {
            return cb(err);
        }

        // TODO: merge data now
        // go through latency + avg if not null

        var p = path.join(__dirname, '../public/data.json');

        writeData(data[1], p, cb);
    });
};

function writeData(d, target, cb) {
    write(JSON.stringify(d), target, function(err) {
        if(err) {
            return cb(err);
        }

        cb(null, d);
    });
}

/* dotcom */
function getDotcomData(o, cb) {
    var fmt = 'MM/DD/YYYY';
    var url = 'https://xmlreporter.dotcom-monitor.com/reporting/xml/responses.aspx?' +
        qs.stringify({
            pid: o.auth,
            Site: '*',
            Type: 'Day',
            Options: 'AllDownPercentages',
            From: o.from.toFormat(fmt),
            To: o.to.toFormat(fmt),
        });

    request(url, function(err, res) {
        if(err) {
            return cb(err);
        }

        var xml = res.body;

        parseString(xml, function(err, result) {
            if(err) {
                return cb(err);
            }

            var siteData = result.DotcomMonitorOnlineReport.Site;

            cb(null, {
                providers: parseDotcomAverages(siteData)
            });
        });
    });
}

function parseDotcomAverages(siteData) {
    return siteData.map(function(v) {
        var attrs = v.$;
        var summary = v.Summary;

        return {
            name: attrs.Name,
            latency: summary.map(function(s) {
                var avgRes = s['Average-Response-Time'];
                var avgResponse = avgRes ? avgRes[0] : null;
                avgResponse = parseFloat(avgResponse);

                if(!avgResponse) {
                    avgResponse = null;
                }

                return avgResponse;
            })
        };
    });
}

/* pingdom */
function getPingdomData(o, cb) {
    pingdom.checks(function(err, checks) {
        if(err) {
            return cb(err);
        }

        async.parallel(constructChecks(o, checks), function(err, data) {
            if(err) {
                return cb(err);
            }

            cb(null, structure(data));
        });
    });
}

function constructChecks(o, checks) {
    return checks.map(function(check) {
        return function(cb) {
            var from = o.from;
            var to = o.to;

            async.series([
                getSummaries.bind(undefined, check, from, to),
                getDowntimes.bind(undefined, check, from, to)
            ], function(err, data) {
                if(err) {
                    return console.error(err);
                }

                cb(err, {
                    summaries: data[0],
                    downtimes: data[1]
                });
            });
        };
    });
}

function getSummaries(check, from, to, cb) {
    // downtime info is in seconds, not accurate enough...
    pingdom['summary.performance'](function(err, data) {
        cb(err, {
            check: check,
            data: data
        }); // skip res
    }, {
        target: check.id,
        qs: {
            from: from,
            to: to,
            resolution: 'day'
        }
    });
}

function getDowntimes(check, from, to, cb) {
    pingdom['summary.outage'](function(err, outages) {
        // skip res
        cb(err, outages && outages.states? calculateDowntimes(outages.states, from, to): []);
    }, {
        target: check.id,
        qs: {
            from: from,
            to: to
        }
    });
}

function calculateDowntimes(data, from, to) {
    var ret = zeroes(from.getDaysBetween(to));
    var downFrom, downTo, fromDelta, toDelta, next;

    // calculate downtimes per day and sum them up as ms
    data.filter(equals('status', 'down')).forEach(function(v) {
        downFrom = new Date(v.timefrom * 1000);
        downTo = new Date(v.timeto * 1000);
        fromDelta = from.getDaysBetween(downFrom);
        toDelta = from.getDaysBetween(downTo);

        if(fromDelta === toDelta) {
            ret[fromDelta] += downTo - downFrom;
        }
        else {
            next = downTo.clone().clearTime();

            ret[fromDelta] += next - downFrom;
            ret[toDelta] += downTo - next;
        }
    });

    return ret;
}

function structure(data) {
    var days = data[0].summaries.data.days;

    return {
        providers: data.map(function(d) {
            var summaries = d.summaries;
            var check = summaries.check;

            if(check.name.split(' ').length > 1 && check.name.indexOf('dd') !== 0) {
                return {
                    name: check.name,
                    host: check.hostname,
                    type: check.name.split(' ')[1].toLowerCase(),
                    latency: parseLatency(summaries.data.days),
                    downtime: d.downtimes
                };
            }
        }).filter(id),
        firstDate: days[0].starttime,
        lastDate: days[days.length - 1].starttime
    };

    function parseLatency(data) {
        return data.map(function(v) {
            return v.avgresponse;
        });
    }
}

// TODO: move to some utility lib
function zeroes(a) {
    var ret = [];
    var i;

    for(i = 0; i < a; i++) {
        ret.push(0);
    }

    return ret;
}

// TODO: move to some utility lib
function equals(a, b) {
    return function(v) {
        return v[a] === b;
    };
}

// TODO: move to some utility lib
function write(data, target, cb) {
    fs.writeFile(target, data, function(err) {
        if(err) {
            return cb(err);
        }

        console.log('Wrote ' + target);

        cb();
    });
}

function id(a) {return a;}

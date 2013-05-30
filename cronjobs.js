var fs = require('fs');

require('date-utils');

var config = require('./conf');

var async = require('async');
var cronJob = require('cron').CronJob;
var pingdom = require('pingdom-api')(config.pingdom);


function init() {
    writeJSON();

    new cronJob('*/ 0 0 0 * * *', writeJSON, null, true);
}
module.exports = init;

function writeJSON() {
    pingdom.checks(function(err, checks) {
        if(err) return console.error(err);

        async.parallel(forAll(checks, getSummary), function(err, data) {
            if(err) return console.error(err);

            write(JSON.stringify(structure(data)), './public/data.json');
        });
    });
}

function forAll(checks, fn) {
    return checks.map(function(check) {
        return function(cb) {
            fn(check, cb);
        };
    });
}

function getSummary(check, cb) {
    var to = Date.today();
    var from = to.clone().addMonths(-6);

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
            resolution: 'day',
            includeuptime: true
        }
    });
}

function structure(data) {
    var days = data[0].data.days;

    return {
        providers: data.map(function(d) {
            var check = d.check;

            return {
                name: check.name,
                host: check.hostname,
                type: check.name.split(' ')[1].toLowerCase(),
                latency: parseLatency(d.data.days),
                uptime: parseUptime(d.data.days)
            };
        }),
        firstDate: days[0].starttime,
        lastDate: days[days.length - 1].starttime
    };

    function parseLatency(data) {
        return data.map(function(v) {
            return v.avgresponse;
        });
    }

    function parseUptime(data) {
        return days.map(function(v) {
            return parseFloat(((v.uptime / (v.uptime + v.downtime)) * 100).toFixed(4));
        });
    }
}

function write(data, target) {
    fs.writeFile(target, data, function(err) {
        if(err) return console.error(err);

        console.log('Wrote ' + target);
    });
}

var fs = require('fs');
var path = require('path');

var async = require('async');
var findWhere = require('lodash').findWhere;

var config = require('../config');

//var getDotcomData = require('../lib/get_dotcom')(config.dotcom.auth);
var getPingdomData = require('../lib/get_pingdom')(config.pingdom);

require('date-utils');

module.exports = function(cb) {
    var to = Date.today();
    var from = to.clone().addMonths(-3);

    async.parallel([
        /*getDotcomData.bind(null, {
            from: from,
            to: to,
        }),*/
        getPingdomData.bind(null, {
            from: from,
            to: to,
        }),
    ], function(err, data) {
        if(err) {
            return cb(err);
        }

        // average pingdom latencies with dotcom
        //data[1].providers = combineData(data[1].providers, data[0].providers);

        var p = path.join(__dirname, '../public/data.json');

        writeData(p, data[0], cb);
    });
};

function combineData(a, b) {
    return a.map(function(o) {
        var obj = findWhere(b, o.name);

        if(obj) {
            return {
                name: o.name,
                latency: o.latency.map(function(v1, i) {
                    var v2 = o.latency[i];

                    // if not null, given latency can't be zero this should be ok
                    if(v2) {
                        return (v1 + v2) / 2;
                    }

                    return v1;
                }),
                downtime: o.downtime,
            }
        }

        return o;
    });
}

function writeData(target, d, cb) {
    fs.writeFile(target, JSON.stringify(d), function(err) {
        if(err) {
            return cb(err);
        }

        console.log('Wrote ' + target);

        cb();
    });
}

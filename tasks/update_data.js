var fs = require('fs');
var path = require('path');

var async = require('async');

var config = require('../config');

var getDotcomData = require('./get_dotcom')(config.dotcom.auth);
var getPingdomData = require('./get_pingdom')(config.pingdom);

require('date-utils');

module.exports = function(cb) {
    var to = Date.today();
    var from = to.clone().addMonths(-3);

    async.parallel([
        getDotcomData.bind(null, {
            from: from,
            to: to,
        }),
        getPingdomData.bind(null, {
            from: from,
            to: to,
        }),
    ], function(err, data) {
        if(err) {
            return cb(err);
        }

        // TODO: merge data now
        // go through latency + avg if not null

        console.log('data', JSON.stringify(data[0]));

        var p = path.join(__dirname, '../public/data.json');

        writeData(data[1], p, cb);
    });
};

function writeData(d, target, cb) {
    fs.writeFile(JSON.stringify(d), target, function(err) {
        if(err) {
            return cb(err);
        }

        console.log('Wrote ' + target);

        cb();
    });
}

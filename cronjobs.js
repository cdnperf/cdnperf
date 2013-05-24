var fs = require('fs');

var async = require('async');
var cronJob = require('cron').CronJob;

var config = require('./config');
var data = require('./data')(config.pingdom);


function init() {
    writeJSON('data.json');
}
module.exports = init;

function writeJSON(outputName) {
    if(!config.amountOfDays) return console.error('Missing "amountOfDays" at config');

    var params = {
        range: config.amountOfDays,
        date: new Date()
    };
    var delay = config.cron.delay || 5;

    write();

    if(!config.cron.enabled) return;

    new cronJob('*/' + delay + ' * * * *', write, null, true);

    function write() {
        async.series([
            data.latency.bind(undefined, params),
            data.uptime.bind(undefined, params)
        ], function(err, data) {
            if(err) return console.error(err);
            if(data.length != 2) return console.error('writeJSON - received wrong amount of data!');

            fs.writeFile('./public/' + outputName, JSON.stringify({
                latency: data[0],
                uptime: data[1]
            }), function(err) {
                if(err) return console.error(err);

                console.log('Wrote ' + outputName);
            });
        });
    }
}

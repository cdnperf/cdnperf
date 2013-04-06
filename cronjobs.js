var fs = require('fs');

var cronJob = require('cron').CronJob;

var config = require('./config');
var data = require('./data');


function init() {
    writeJSON();
}
module.exports = init;

function writeJSON() {
    write();

    new cronJob('*/5 * * * *', write, null, true);

    function write() {
        data.checks(config.pingdom, 50, function(err, data) {
            fs.writeFile('./public/data.json', JSON.stringify(data), function(err) {
                if(err) return console.error(err);

                console.log('Wrote data.json');
            });
        });
    }
}

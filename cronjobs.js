var fs = require('fs');

var cronJob = require('cron').CronJob;

var data = require('./data')(require('./config').pingdom);


function init() {
    writeJSON();
}
module.exports = init;

function writeJSON() {
    write();

    new cronJob('*/5 * * * *', write, null, true);

    function write() {
        data.checks({
            limit: 50
        }, function(err, data) {
            fs.writeFile('./public/data.json', JSON.stringify(data), function(err) {
                if(err) return console.error(err);

                console.log('Wrote data.json');
            });
        });
    }
}

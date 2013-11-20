var cron = require('../lib/cron');

cron.sendMessage(function(message, cb) {
    console.log(message);

    cb();
}, function(err) {
    if(err) return console.error(err);
});

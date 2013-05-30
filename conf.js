var config;

try {
    config = require('./config');
}
catch(e) {
    var env = process.env;

    config = {
        port: env.PORT,
        ga: env.GA,
        cron: env.CRON,
        pingdom: {
            user: env.PINGDOM_USER,
            pass: env.PINGDOM_PASS,
            appkey: env.PINGDOM_APPKEY
        }
    };
}

module.exports = config;

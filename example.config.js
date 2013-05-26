module.exports = {
    port: 8000,
    ga: 'UA-XXXXX-X',
    amountOfDays: 14,
    cron: {
        enabled: true,
        delay: 5 // in minutes
    },
    cookieSecret: 'thisisnotsafe',
    pingdom: {
        user: 'replacethis',
        pass: 'replacethis',
        appkey: 'replacethis'
    }
};

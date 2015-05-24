module.exports = {
    port: 8000,
    ga: 'UA-XXXXX-X',
    mixpanel: 'replacethis',
    tasks: {
        tweet: {hour: 12, instant: false},
        update_data: {minute: 0}
    },
    pingdom: {
        user: 'replacethis',
        pass: 'replacethis',
        appkey: 'replacethis'
    },
    dotcom: {
        auth: 'replacethis',
    },
    cloudflare: {
        apikey: 'replacethis',
        email: 'replacethis',
        domain: 'cdnperf.com'
    },
    twitter: {
        key: 'replacethis',
        secret: 'replacethis',
        accessToken: 'replacethis',
        accessTokenSecret: 'replacethis'
    }
};

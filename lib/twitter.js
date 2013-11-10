var twitter = require('simple-twitter');


function init(config) {
    return new twitter(config.key, config.secret,
        config.accessToken, config.accessTokenSecret);
}
module.exports = init;

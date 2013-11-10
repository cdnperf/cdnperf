var config = require('../config').twitter;
var twitter = require('../lib/twitter')(config);

twitter.get('statuses/user_timeline', function(err, data) {
    if(err) return console.error(err);

    console.dir(data);
});

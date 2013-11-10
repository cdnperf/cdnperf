var twitter;


module.exports = init;

function init(config) {
    twitter = require('./twitter')(config);

    return function(status, cb) {
        twitter.post('statuses/update', {
            status: status
        }, function(err) {
            if(err) return console.error(err);
        });
    };
}

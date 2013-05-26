var config = require('./config');

exports.index = function(req, res) {
    res.render('index', {
        ga: config.ga || 'UA-XXXXX-X'
    });
};

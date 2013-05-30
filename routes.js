var config = require('./conf');

exports.index = function(req, res) {
    res.render('index', {
        ga: config.ga || 'UA-XXXXX-X'
    });
};

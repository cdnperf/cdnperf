module.exports = function(name) {
    return function(req, res) {
        res.sendfile(__dirname + '/public/' + name + '.html');
    };
};

module.exports = function(config, name) {
    return function(req, res) {
        res.render(name, {
            bugira: config.bugira,
            ga: config.ga
        });
    };
};

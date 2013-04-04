var request = require('request');
var ziptoo = require('funkit').functional.ziptoo;


function init(config) {
    var baseUrl = 'https://api.pingdom.com/api/2.0/';
    var resources = ['checks', 'results'];

    return ziptoo(resources.map(function(resource) {
        return [resource, template.bind(undefined, config, baseUrl, resource)];
    }))
}
module.exports = init;

function template(config, baseUrl, property, cb, o) {
    o = o || {};
    var target = o.target || '';
    var qs = o.qs || {};

    request.get(baseUrl + property + '/' + target, {
        auth: config,
        headers: {
            'App-Key': config.appkey
        },
        qs: qs
    }, function(err, res) {
        cb(err, JSON.parse(res.body)[property]);
    });
}

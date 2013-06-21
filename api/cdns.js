module.exports = {
    updateData: updateData,
    getNames: getNames,
    get: get
};

var data = {};

function updateData(d) {
    d.providers.map(function(provider) {
        var name = provider.name.split(' ')[0].toLowerCase();

        if(!(name in data)) data[name] = {};

        data[name][provider.type] = last(provider.latency);
    });
}

function last(arr) {
    return arr[arr.length - 1];
}

function getNames(request, response) {
    response.json(Object.keys(data));
}

function get(request, response) {
    var name = request.params.name;

    if(name in data) return response.json(data[name]);

    response.send(403);
}

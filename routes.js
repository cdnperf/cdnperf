exports.index = function(req, res) {
    res.render('index', {
        types: ['CDN', 'Uptime', 'Latency', 'Projects', 'Provider'],
        cdns: [
            {
                name: 'cdnjs',
                link: 'http://cdnjs.com/',
                uptime: 99.9,
                latency: [],
                projects: 123,
                provider: 'TODO'
            },
            {
                name: 'jsDelivr',
                link: 'http://www.jsdelivr.com/',
                uptime: 99.9,
                latency: [],
                projects: 123,
                provider: 'TODO'
            }
        ]
    });
};

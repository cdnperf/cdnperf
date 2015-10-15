'use strict';
var qs = require('querystring');

var request = require('request');
var parseString = require('xml2js').parseString;

module.exports = function(auth) {
    return function(o, cb) {
        var fmt = 'MM/DD/YYYY';
        var url = 'https://xmlreporter.dotcom-monitor.com/reporting/xml/responses.aspx?' +
            qs.stringify({
                pid: auth,
                Site: '*',
                Type: 'Day',
                Options: 'AllDownPercentages',
                From: o.from.toFormat(fmt),
                To: o.to.toFormat(fmt),
            });

        request(url, function(err, res) {
            if(err) {
                return cb(err);
            }

            var xml = res.body;

            parseString(xml, function(err, result) {
                if(err) {
                    return cb(err);
                }

                var report = result.DotcomMonitorOnlineReport;

                if(!report) {
                    return cb(new Error('Missing report!'));
                }

                var siteData = report.Site;

                cb(null, {
                    providers: parseDotcomAverages(siteData)
                });
            });
        });
    };
};

function parseDotcomAverages(siteData) {
    if(!siteData) {
        console.error('parseDotcomAverages - Failed to get siteData');

        return [];
    }

    return siteData.map(function(v) {
        var attrs = v.$;
        var summary = v.Summary;

        return {
            name: attrs.Name,
            latency: summary.map(function(s) {
                var avgRes = s['Average-Response-Time'];
                var avgResponse = avgRes ? avgRes[0] : null;
                avgResponse = parseFloat(avgResponse) * 1000;

                if(!avgResponse) {
                    avgResponse = null;
                }

                return avgResponse;
            })
        };
    });
}

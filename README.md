# CDNperf

CDNperf monitors popular CDN sites and graphs this data.

## Development

1. `npm install`
2. `cp example.config.js config.js` and adjust as needed

## Hosting

1. Set NODE\_ENV to 'production' (important as this enables view caching!)
2. Run the app on top of `forever` or similar

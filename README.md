# CDNperf [![Dependency Status](https://david-dm.org/bebraw/cdnperf.svg)](https://david-dm.org/bebraw/cdnperf) [![devDependency Status](https://david-dm.org/bebraw/cdnperf/dev-status.svg)](https://david-dm.org/bebraw/cdnperf#info=devDependencies)

CDNperf monitors popular CDN sites and graphs this data.

## Development

1. `npm install`
2. `cd config`
3. `cp config.template.js config.js` and adjust as needed
4. `npm run build` to generate the static site

In order to get some test data to show up, please copy
`http://www.cdnperf.com/data.json` to `public/`.

## Hosting

1. Set `NODE_ENV` to 'production' (important as this enables view caching!)
2. Run the app on top of `forever` or similar

If you are running on Heroku, remember to set environment variables as documented on `config.js`.
See also [their documentation](https://devcenter.heroku.com/articles/nodejs) on the topic.

## License

MIT. See LICENSE for details.

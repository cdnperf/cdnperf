# API

CDNperf provides a simple API. It has been specified as follows:

* GET [/api/v1/cdns](/api/v1/cdns) -> ['jsdelivr', 'cdnjs', ...]
* GET [/api/v1/cdns/jsdelivr](/api/v1/cdns/jsdelivr) -> {"ping": 89, "http": 104, "https": "98"}. The values are in ms. If zero is returned, you can assume the CDN happens to be down. In case invalid name is passed, 403 error is returned.

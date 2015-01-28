# How to use CDNs?

There are two basic techniques that can be used to load data from a CDN. You can simply use a script tag. If you are developing something more complex, you may want to use a [RequireJS](http://requirejs.org/) based approach.

## Using Script Tags

The example below loads jQuery from Google. As it is possible the query might fail for a reason or another, there's a fallback that allows you to load a local resource instead.

```html
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
<script>
    window.jQuery || document.write('<script src="js/jquery-1.8.3.min.js"><\/script>')
</script>
```

Generally it is not a good idea to point at a resource know as *latest*. This will lead to trouble when some breaking changes appear to the library.

## RequireJS Based Approach

Using CDNs with RequireJS is quite simple. You simply use the path configuration as below. RequireJS deals with the details for you.

```json
requirejs.config({
    paths: {
        jquery: ['https://ajax.googleapis.com/ajax/libs/jquery/1.9.2/jquery.min.js',
        'lib/jquery'] // Fallback
    }
});
```

On module level you just point to jQuery as usual:

```js
define(['jquery'], function($) {
    //$ points to jQuery
});
```

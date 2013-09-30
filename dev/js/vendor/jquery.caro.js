/*! jquery.caro - v0.9.0 - Juho Vepsalainen - MIT
https://github.com/bebraw/jquery.caro - 2013-09-30 */
/*! jquery.caro - v0.8.2 - Juho Vepsalainen - MIT
https://github.com/bebraw/jquery.caro - 2013-09-10 */
(function ($) {
    function horizontalCaro($elem, opts) {
        caroize($elem, opts, 'left', 'width');
    }

    function verticalCaro($elem, opts) {
        caroize($elem, opts, 'top', 'height');
    }

    function caroize($elem, opts, dir, axis) {
        var $slideContainer = $('.slides:first', $elem);
        var $slides = $slideContainer.children().append($('<div>'));
        var $wrapper = $('<div>').append($slides).appendTo($slideContainer);
        var $navi = $('.' + opts.classes.navi + ':last', $elem);
        var amount = $slides.length;
        var pos = opts.initialSlide;

        initCSS($slideContainer, axis, $wrapper, dir, $slides);
        initTitles($slides, $navi, moveTemplate, opts.autoNavi, opts.classes.button);
        initNavi($elem, $wrapper, moveTemplate, opts.classes);
        initPlayback($elem, $wrapper, moveTemplate, opts.autoPlay, opts.still);

        if(opts.resize) updateHeight($slideContainer, $slides, pos);

        disableSelection($elem);

        $(window).resize(function() {
            updateHeight($slideContainer, $slides, pos);
        });

        if(pos) {
            $wrapper.css(dir, (pos * -100) + '%');
            $slideContainer.css('height', $slides.eq(pos).height());
        }

        update(pos, opts.classes.button);

        function moveTemplate(indexCb, animCb) {
            return function() {
                if(opts.cycle) {
                    pos = indexCb(pos, amount - 1);
                    if(pos < 0) pos = amount - 1;
                    if(pos > amount - 1) pos = 0;
                }
                else pos = clamp(indexCb(pos, amount - 1), 0, amount - 1);

                var animProps = {};
                animProps[dir] = (pos * -100) + '%';
                $wrapper.animate(animProps, opts.delay, animCb);

                update(pos, opts.classes.button);
                updateHeight(pos, opts.classes.button);

                $elem.trigger('updateSlide', [pos]);
            };
        }

        function update(i, buttonClass) {
            updateNavi($navi, i, buttonClass);
            if(!opts.cycle) updateButtons($elem, i, amount);
            updateSlides($slides, i);
        }

        function updateHeight(i, buttonClass) {
            $slideContainer.css('height', $slides.eq(i).height());

            // TODO: figure out why this doesn't animate
            if(opts.resize) {
                $slideContainer.animate({
                    'height': $slides.eq(i).height() || undefined
                }, opts.resizeDelay, function() {
                    $elem.parents('.slides').siblings('.navi').
                        find('.selected.' + buttonClass + ':first').trigger('click');
                });
            }
        }
    }

    function updateHeight($slideContainer, $slides, pos) {
        $slideContainer.height($slides.eq(pos).height() || undefined);
    }

    function clamp(i, min, max) {
        return Math.min(Math.max(i, min), max);
    }

    function initCSS($slideContainer, axis, $wrapper, dir, $slides) {
        $slideContainer.css('overflow', 'hidden');
        var wrapperOpts = {
            position:'relative'
        };
        wrapperOpts[axis] = $slides.length * 100 + '%';
        wrapperOpts[dir] = 0 + '%';
        $wrapper.css(wrapperOpts);

        var slideOpts = {
            display: dir == 'top'? 'auto': 'inline-block',
            'vertical-align':'top'
        };
        var len = 100 / $slides.length;
        slideOpts[axis] = parseInt(len, 10) + '%';

        // opera hack! opera rounds width so we need to deal with that using some
        // padding
        var half = ((len - parseInt(len, 10)) / 2) + '%';
        if(axis == 'width') {
            slideOpts['margin-left'] = half;
            slideOpts['margin-right'] = half;
        }
        else {
            slideOpts['margin-top'] = half;
            slideOpts['margin-bottom'] = half;
        }
        $slides.each(function (i, e) {
            $(e).css(slideOpts).addClass('slide');
        });
    }

    function initTitles($slides, $navi, move, autoNavi, buttonClass) {
        $slides.each(function (i, k) {
            var $e = $('<a>', {href: '#'}).css('display', 'inline').bind('click',
                function(e) {
                    e.preventDefault();

                    move(function () {
                        return i;
                    })();
                }).appendTo($navi).addClass('title ' + buttonClass);

            if(autoNavi) {
                $(k).clone().appendTo($e);
            }
            else {
                $e.text($(k).attr('title') || i + 1);
            }
        });
    }

    function initNavi($elem, $wrapper, move, classes) {
        function bind(sel, cb) {
            $('[data-caro="' + sel + '"]').bind('click', fn);
            $elem.find('.' + sel).bind('click', preventDefault(fn));

            function preventDefault(f) {
                return function(e) {
                    e.preventDefault();

                    f(e);
                };
            }

            function fn(e) {
                $wrapper.clearQueue();
                move(function(a, len) {
                    var val = $elem.triggerHandler('beforeSlide', [a]);

                    if(!isDefined(val) || val) return cb(a, len);
                })();
            }
        }

        bind(classes.prev, function (a) {
            var ret = a - 1;

            $elem.trigger('previousSlide', [ret]);

            return ret;
        });
        bind(classes.next, function (a) {
            var ret = a + 1;

            $elem.trigger('nextSlide', [ret]);

            return ret;
        });
        bind(classes.first, function () {
            var ret = 0;

            $elem.trigger('firstSlide', [ret]);

            return ret;
        });
        bind(classes.last, function (a, len) {
            var ret = len;

            $elem.trigger('lastSlide', [ret]);

            return ret;
        });
    }

    function isDefined(a) {
        return typeof a !== 'undefined';
    }

    function initPlayback($elem, $wrapper, move, autoPlay, still) {
        var anim = move(function (a, len) {
            return a == len ? 0 : a + 1;
        }, function () {
            $(this).delay(still).queue(function() {
                anim();
                $(this).dequeue();
            });
        });

        $elem.find('.play').bind('click', function(e) {
            e.preventDefault();

            anim();
        });
        $elem.find('.stop').bind('click', function(e) {
            e.preventDefault();

            $wrapper.clearQueue();
        });
    }

    function updateNavi($navi, i, buttonClass) {
        var $titles = $navi.find('.title.' + buttonClass);

        $titles.removeClass('selected');
        $titles.eq(i).addClass('selected');
    }

    function updateButtons($elem, i, amount) {
        var $begin = $elem.find('.first,.prev');
        var $end = $elem.find('.last,.next');

        if(i === 0) $begin.addClass('disabled');
        else $begin.removeClass('disabled');

        if(i == amount - 1) $end.addClass('disabled');
        else $end.removeClass('disabled');
    }

    function updateSlides($slides, i) {
        $slides.each(function(j, e) {
            var $e = $(e);

            $e.removeClass('prev current next');

            if(j == i - 1) {
                $e.addClass('prev');
            }

            if(j == i) {
                $e.addClass('current');
            }

            if(j == i + 1) {
                $e.addClass('next');
            }
        });
    }

    function disableSelection($e) {
        // http://stackoverflow.com/questions/2700000/how-to-disable-text-selection-using-jquery
        return $e.each(function() {
            $(this).attr('unselectable', 'on').css({
                   '-moz-user-select':'none',
                   '-webkit-user-select':'none',
                   'user-select':'none'
               }).each(function() {
                   this.onselectstart = function() { return false; };
               });
        });
    }

    $.fn.caro = function (options) {
        return this.each(function () {
            var $elem = $(this);
            var opts = $.extend(true, {
                dir: 'horizontal', // either 'horizontal' or 'vertical'
                delay: 300, // in ms
                still: 1000, // how long slide stays still in playback mode
                autoPlay: false,
                classes: {
                    button: 'button',
                    navi: 'navi',
                    prev: 'prev',
                    next: 'next',
                    first: 'first',
                    last: 'last'
                },
                autoNavi: false,
                cycle: false,
                resize: true,
                resizeDelay: 300, // in ms
                initialSlide: 0
            }, options);

            var caro = opts.dir == 'horizontal' ? horizontalCaro : verticalCaro;
            caro($elem, opts);
        });
    };
})(jQuery);
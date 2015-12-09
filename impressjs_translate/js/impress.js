/**
 * impress.js
 *
 * impress.js is a presentation tool based on the power of CSS3 transforms and transitions
 * in modern browsers and inspired by the idea behind prezi.com.
 * impress.js是一款基于新式浏览器强大特性CSS3变形和过渡的演示文稿(渲染)工具,想法来自
 * 于prezi.com.
 *
 *
 * Copyright 2011-2012 Bartek Szopka (@bartaz)
 *
 * Released under the MIT and GPL Licenses.
 *
 * ------------------------------------------------
 *  author:  Bartek Szopka
 *  version: 0.5.3
 *  url:     http://bartaz.github.com/impress.js/
 *  source:  http://github.com/bartaz/impress.js/
 */

/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, latedef:true, newcap:true,
         noarg:true, noempty:true, undef:true, strict:true, browser:true */

// You are one of those who like to know how things work inside?
// 你是那群想要追根究底的人中的一个吧?
// Let me show you the cogs that make impress.js run...
// 那就让我给你演示到底这些齿轮是怎么让impress.js这个机器运转起来的...(吓屎宝宝了,原
// 来老外也会用比喻句=_=)
(function(document, window) {
    'use strict';

    // HELPER FUNCTIONS

    // `pfx` is a function that takes a standard CSS property name as a parameter
    // and returns it's prefixed version valid for current browser it runs in.
    // The code is heavily inspired by Modernizr http://www.modernizr.com/
    // `pfx`是一个用来返回对应标准CSS属性(以参数形式传入)在当前运行的浏览器中的前缀的方法.
    // 这段代码重度依赖Modernizr http://www.modernizr.com/
    var pfx = (function() {

        var style = document.createElement('dummy').style,
            prefixes = 'Webkit Moz O ms Khtml'.split(' '),
            memory = {};

        return function(prop) {
            if (typeof memory[prop] === "undefined") {

                var ucProp = prop.charAt(0).toUpperCase() + prop.substr(1),
                    props = (prop + ' ' + prefixes.join(ucProp + ' ') + ucProp).split(' ');

                memory[prop] = null;
                for (var i in props) {
                    if (style[props[i]] !== undefined) {
                        memory[prop] = props[i];
                        break;
                    }
                }

            }

            return memory[prop];
        };

    })();

    // `arraify` takes an array-like object and turns it into real Array
    // to make all the Array.prototype goodness available.
    // `arrayify`方法需传入一个类数组的对象,然后将它转换成一个真正的数组来调用
    // Array.prototype上的方法.
    var arrayify = function(a) {
        return [].slice.call(a);
    };

    // `css` function applies the styles given in `props` object to the element
    // given as `el`. It runs all property names through `pfx` function to make
    // sure proper prefixed version of the property is used.
    // `css`方法
    var css = function(el, props) {
        var key, pkey;
        for (key in props) {
            if (props.hasOwnProperty(key)) {
                pkey = pfx(key);
                if (pkey !== null) {
                    el.style[pkey] = props[key];
                }
            }
        }
        return el;
    };

    // `toNumber` takes a value given as `numeric` parameter and tries to turn
    // it into a number. If it is not possible it returns 0 (or other value
    // given as `fallback`).
    // `toNumber`方法将`numeric`参数的值转化成数字,如果是非数字则转换成0或者是`fallback`
    // 参数的值(如果有这个参数的话).
    var toNumber = function(numeric, fallback) {
        return isNaN(numeric) ? (fallback || 0) : Number(numeric);
    };

    // `byId` returns element with given `id` - you probably have guessed that ;)
    // `byId`其实就是document.getElementById的一个简单封装.
    var byId = function(id) {
        return document.getElementById(id);
    };

    // `$` returns first element for given CSS `selector` in the `context` of
    // the given element or whole document.
    // `$`方法根据`selector`参数在document或者`context`参数(如果有这个参数的话)给定的上
    // 下文中查找元素,注意,该方法只返回首个匹配的元素.
    var $ = function(selector, context) {
        context = context || document;
        return context.querySelector(selector);
    };

    // `$$` return an array of elements for given CSS `selector` in the `context` of
    // the given element or whole document.
    // `$$`和`$`非常相似,唯一不同的是该方法返回所有匹配的元素.
    var $$ = function(selector, context) {
        context = context || document;
        return arrayify(context.querySelectorAll(selector));
    };

    // `triggerEvent` builds a custom DOM event with given `eventName` and `detail` data
    // and triggers it on element given as `el`.
    // `triggerEvent`方法根据`eventName`参数和`detail`参数来创建一个自定义DOM事件并绑定到`el`参数
    // 指定的元素上.
    var triggerEvent = function(el, eventName, detail) {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(eventName, true, true, detail);
        el.dispatchEvent(event);
    };

    // `translate` builds a translate transform string for given data.
    // `translate`方法根据参数值拼接平移变形字符串(用于CSS样式).
    var translate = function(t) {
        return " translate3d(" + t.x + "px," + t.y + "px," + t.z + "px) ";
    };

    // `rotate` builds a rotate transform string for given data.
    // By default the rotations are in X Y Z order that can be reverted by passing `true`
    // as second parameter.
    // `rotate`方法根据参数值拼接旋转变形字符串(用于CSS样式).
    // 默认情况下是以X Y Z的顺序来旋转,但可以通过设置`revert`参数值为`true`来更改旋转方向为Z Y X.
    var rotate = function(r, revert) {
        var rX = " rotateX(" + r.x + "deg) ",
            rY = " rotateY(" + r.y + "deg) ",
            rZ = " rotateZ(" + r.z + "deg) ";

        return revert ? rZ + rY + rX : rX + rY + rZ;
    };

    // `scale` builds a scale transform string for given data.
    // `scale`方法根据参数值拼接缩放变形字符串(用于CSS样式).
    var scale = function(s) {
        return " scale(" + s + ") ";
    };

    // `perspective` builds a perspective transform string for given data.
    // `perspective`方法根据参数值拼接视角变形字符串(用于CSS样式).
    var perspective = function(p) {
        return " perspective(" + p + "px) ";
    };

    // `getElementFromHash` returns an element located by id from hash part of
    // window location.
    // `getElementFromHash`方法根据写在URL的锚部分(hash part,也就是URL上从#号开始的部
    // 分)上的id来得到匹配的元素并返回.
    var getElementFromHash = function() {
        // get id from url # by removing `#` or `#/` from the beginning,
        // so both "fallback" `#slide-id` and "enhanced" `#/slide-id` will work
        // 将URL上锚部分开头的`#`或`#/`删除掉,所以无论是"回退版"(用于兼容)的`#slide-id`
        // 还是"增强版"(新式浏览器支持的)的`#/slide-id`都能正常工作.
        return byId(window.location.hash.replace(/^#\/?/, ""));
    };

    // `computeWindowScale` counts the scale factor between window size and size
    // defined for the presentation in the config.
    // `computeWindowScale`方法根据浏览器窗口大小以及config值里定义的演示文稿尺寸值来计算
    // 缩放系数.
    var computeWindowScale = function(config) {
        var hScale = window.innerHeight / config.height,
            wScale = window.innerWidth / config.width,
            scale = hScale > wScale ? wScale : hScale;

        if (config.maxScale && scale > config.maxScale) {
            scale = config.maxScale;
        }

        if (config.minScale && scale < config.minScale) {
            scale = config.minScale;
        }

        return scale;
    };

    // CHECK SUPPORT
    // 检测浏览器支持情况
    var body = document.body;

    var ua = navigator.userAgent.toLowerCase();
    var impressSupported =
        // browser should support CSS 3D transtorms
        // 浏览器需支持CSS 3D 变形
        (pfx("perspective") !== null) &&

        // and `classList` and `dataset` APIs
        // 以及`classList`和`dataset`APIs
        (body.classList) &&
        (body.dataset) &&

        // but some mobile devices need to be blacklisted,
        // because their CSS 3D support or hardware is not
        // good enough to run impress.js properly, sorry...
        // 但是一些移动设备需要被列入黑名单,因为它们的CSS 3D支持情况
        // 或者硬件支持都不太好,运行impress.js可能会非常吃力,抱歉...
        (ua.search(/(iphone)|(ipod)|(android)/) === -1);

    if (!impressSupported) {
        // we can't be sure that `classList` is supported
        // 我们不能保证`classList`是否被支持.(所以才用className)
        body.className += " impress-not-supported ";
    } else {
        body.classList.remove("impress-not-supported");
        body.classList.add("impress-supported");
    }

    // GLOBALS AND DEFAULTS
    // 全局变量和默认值

    // This is where the root elements of all impress.js instances will be kept.
    // Yes, this means you can have more than one instance on a page, but I'm not
    // sure if it makes any sense in practice ;)
    // 这是用于保存所有impress.js实例根元素的变量.
    // 是的,这意味着你在一个页面上可以拥有不止一个实例(也就是不止一个演示文稿),但我不确定这是否
    // 有任何实际意义 ;)
    var roots = {};

    // some default config values.
    // 一些默认值.
    var defaults = {
        width: 1024,
        height: 768,
        maxScale: 1,
        minScale: 0,

        perspective: 1000,

        transitionDuration: 1000
    };

    // it's just an empty function ... and a useless comment.
    // 只是一个空的方法...以及一条无用的注释.(这老外还真够幽默的=_=)
    var empty = function() {
        return false;
    };

    // IMPRESS.JS API

    // And that's where interesting things will start to happen.
    // It's the core `impress` function that returns the impress.js API
    // for a presentation based on the element with given id ('impress'
    // by default).
    // 这里就是有趣的事情开发发生的地方了.(现在,就是见证奇迹的时刻!)
    // `impress`方法是最核心的方法,它返回一个impress.js的API,该API对应一个基于
    // 具有给定id(默认是'impress')元素的演示文稿.
    var impress = window.impress = function(rootId) {

        // If impress.js is not supported by the browser return a dummy API
        // it may not be a perfect solution but we return early and avoid
        // running code that may use features not implemented in the browser.
        // 如果浏览器不支持impress.js将会返回一个dummy(假的)API.
        // 这可能不是一个完美的解决方案,但是我们早一些返回它有助于避免运行那些浏览器不支持
        // 的代码.
        if (!impressSupported) {
            return {
                init: empty,
                goto: empty,
                prev: empty,
                next: empty
            };
        }

        rootId = rootId || "impress";

        // if given root is already initialized just return the API
        // 如果给定的根(其实就是演示文稿的最外层元素的id号)已经初始化了就直接
        // 返回对应的API
        if (roots["impress-root-" + rootId]) {
            return roots["impress-root-" + rootId];
        }

        // data of all presentation steps
        // 用于保存演示文稿里所有幻灯片的数据
        var stepsData = {};

        // element of currently active step
        // 用于保存当前播放的幻灯片的元素
        var activeStep = null;

        // current state (position, rotation and scale) of the presentation
        // 用于保存演示文稿的实时状态(包括位置,旋转情况以及缩放情况)
        var currentState = null;

        // array of step elements
        // 用于保存幻灯片元素的数组
        var steps = null;

        // configuration options
        // 配置选项
        var config = null;

        // scale factor of the browser window
        // 浏览器窗口的缩放系数
        var windowScale = null;

        // root presentation elements
        // 演示文稿的根元素
        var root = byId(rootId);
        var canvas = document.createElement("div");

        var initialized = false;

        // STEP EVENTS
        // 幻灯片事件

        // There are currently two step events triggered by impress.js
        // `impress:stepenter` is triggered when the step is shown on the
        // screen (the transition from the previous one is finished) and
        // `impress:stepleave` is triggered when the step is left (the
        // transition to next step just starts).
        // 目前impress.js已经绑定了两个幻灯片事件.
        // `impress:stepenter`事件当幻灯片开始在屏幕上播放时(上一个过渡结束时)会
        // 被触发,`impress:stepleave`事件当幻灯片离开屏幕时(下一个过渡开始时)会被
        // 触发.

        // reference to last entered step
        // 一个引用,引用的是上一张播放的幻灯片.
        var lastEntered = null;

        // `onStepEnter` is called whenever the step element is entered
        // but the event is triggered only if the step is different than
        // last entered step.
        // `onStepEnter`事件当幻灯片元素进入时就会被触发,但是仅仅在当前进入的幻灯片
        // 不是上一张幻灯片时才会触发.
        var onStepEnter = function(step) {
            if (lastEntered !== step) {
                triggerEvent(step, "impress:stepenter");
                lastEntered = step;
            }
        };

        // `onStepLeave` is called whenever the step element is left
        // but the event is triggered only if the step is the same as
        // last entered step.
        // `onStepLeave`事件当幻灯片元素离开时就会被触发,但是仅仅在当前离开的幻
        // 灯片是上一张幻灯片时才会触发.
        var onStepLeave = function(step) {
            if (lastEntered === step) {
                triggerEvent(step, "impress:stepleave");
                lastEntered = null;
            }
        };

        // `initStep` initializes given step element by reading data from its
        // data attributes and setting correct styles.
        var initStep = function(el, idx) {
            var data = el.dataset,
                step = {
                    translate: {
                        x: toNumber(data.x),
                        y: toNumber(data.y),
                        z: toNumber(data.z)
                    },
                    rotate: {
                        x: toNumber(data.rotateX),
                        y: toNumber(data.rotateY),
                        z: toNumber(data.rotateZ || data.rotate)
                    },
                    scale: toNumber(data.scale, 1),
                    el: el
                };

            if (!el.id) {
                el.id = "step-" + (idx + 1);
            }

            stepsData["impress-" + el.id] = step;

            css(el, {
                position: "absolute",
                transform: "translate(-50%,-50%)" +
                    translate(step.translate) +
                    rotate(step.rotate) +
                    scale(step.scale),
                transformStyle: "preserve-3d"
            });
        };

        // `init` API function that initializes (and runs) the presentation.
        var init = function() {
            if (initialized) {
                return;
            }

            // First we set up the viewport for mobile devices.
            // For some reason iPad goes nuts when it is not done properly.
            var meta = $("meta[name='viewport']") || document.createElement("meta");
            meta.content = "width=device-width, minimum-scale=1, maximum-scale=1, user-scalable=no";
            if (meta.parentNode !== document.head) {
                meta.name = 'viewport';
                document.head.appendChild(meta);
            }

            // initialize configuration object
            var rootData = root.dataset;
            config = {
                width: toNumber(rootData.width, defaults.width),
                height: toNumber(rootData.height, defaults.height),
                maxScale: toNumber(rootData.maxScale, defaults.maxScale),
                minScale: toNumber(rootData.minScale, defaults.minScale),
                perspective: toNumber(rootData.perspective, defaults.perspective),
                transitionDuration: toNumber(rootData.transitionDuration, defaults.transitionDuration)
            };

            windowScale = computeWindowScale(config);

            // wrap steps with "canvas" element
            arrayify(root.childNodes).forEach(function(el) {
                canvas.appendChild(el);
            });
            root.appendChild(canvas);

            // set initial styles
            document.documentElement.style.height = "100%";

            css(body, {
                height: "100%",
                overflow: "hidden"
            });

            var rootStyles = {
                position: "absolute",
                transformOrigin: "top left",
                transition: "all 0s ease-in-out",
                transformStyle: "preserve-3d"
            };

            css(root, rootStyles);
            css(root, {
                top: "50%",
                left: "50%",
                transform: perspective(config.perspective / windowScale) + scale(windowScale)
            });
            css(canvas, rootStyles);

            body.classList.remove("impress-disabled");
            body.classList.add("impress-enabled");

            // get and init steps
            steps = $$(".step", root);
            steps.forEach(initStep);

            // set a default initial state of the canvas
            currentState = {
                translate: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                rotate: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                scale: 1
            };

            initialized = true;

            triggerEvent(root, "impress:init", {
                api: roots["impress-root-" + rootId]
            });
        };

        // `getStep` is a helper function that returns a step element defined by parameter.
        // If a number is given, step with index given by the number is returned, if a string
        // is given step element with such id is returned, if DOM element is given it is returned
        // if it is a correct step element.
        var getStep = function(step) {
            if (typeof step === "number") {
                step = step < 0 ? steps[steps.length + step] : steps[step];
            } else if (typeof step === "string") {
                step = byId(step);
            }
            return (step && step.id && stepsData["impress-" + step.id]) ? step : null;
        };

        // used to reset timeout for `impress:stepenter` event
        var stepEnterTimeout = null;

        // `goto` API function that moves to step given with `el` parameter (by index, id or element),
        // with a transition `duration` optionally given as second parameter.
        var goto = function(el, duration) {

            if (!initialized || !(el = getStep(el))) {
                // presentation not initialized or given element is not a step
                return false;
            }

            // Sometimes it's possible to trigger focus on first link with some keyboard action.
            // Browser in such a case tries to scroll the page to make this element visible
            // (even that body overflow is set to hidden) and it breaks our careful positioning.
            //
            // So, as a lousy (and lazy) workaround we will make the page scroll back to the top
            // whenever slide is selected
            //
            // If you are reading this and know any better way to handle it, I'll be glad to hear about it!
            window.scrollTo(0, 0);

            var step = stepsData["impress-" + el.id];

            if (activeStep) {
                activeStep.classList.remove("active");
                body.classList.remove("impress-on-" + activeStep.id);
            }
            el.classList.add("active");

            body.classList.add("impress-on-" + el.id);

            // compute target state of the canvas based on given step
            var target = {
                rotate: {
                    x: -step.rotate.x,
                    y: -step.rotate.y,
                    z: -step.rotate.z
                },
                translate: {
                    x: -step.translate.x,
                    y: -step.translate.y,
                    z: -step.translate.z
                },
                scale: 1 / step.scale
            };

            // Check if the transition is zooming in or not.
            //
            // This information is used to alter the transition style:
            // when we are zooming in - we start with move and rotate transition
            // and the scaling is delayed, but when we are zooming out we start
            // with scaling down and move and rotation are delayed.
            var zoomin = target.scale >= currentState.scale;

            duration = toNumber(duration, config.transitionDuration);
            var delay = (duration / 2);

            // if the same step is re-selected, force computing window scaling,
            // because it is likely to be caused by window resize
            if (el === activeStep) {
                windowScale = computeWindowScale(config);
            }

            var targetScale = target.scale * windowScale;

            // trigger leave of currently active element (if it's not the same step again)
            if (activeStep && activeStep !== el) {
                onStepLeave(activeStep);
            }

            // Now we alter transforms of `root` and `canvas` to trigger transitions.
            //
            // And here is why there are two elements: `root` and `canvas` - they are
            // being animated separately:
            // `root` is used for scaling and `canvas` for translate and rotations.
            // Transitions on them are triggered with different delays (to make
            // visually nice and 'natural' looking transitions), so we need to know
            // that both of them are finished.
            css(root, {
                // to keep the perspective look similar for different scales
                // we need to 'scale' the perspective, too
                transform: perspective(config.perspective / targetScale) + scale(targetScale),
                transitionDuration: duration + "ms",
                transitionDelay: (zoomin ? delay : 0) + "ms"
            });

            css(canvas, {
                transform: rotate(target.rotate, true) + translate(target.translate),
                transitionDuration: duration + "ms",
                transitionDelay: (zoomin ? 0 : delay) + "ms"
            });

            // Here is a tricky part...
            //
            // If there is no change in scale or no change in rotation and translation, it means there was actually
            // no delay - because there was no transition on `root` or `canvas` elements.
            // We want to trigger `impress:stepenter` event in the correct moment, so here we compare the current
            // and target values to check if delay should be taken into account.
            //
            // I know that this `if` statement looks scary, but it's pretty simple when you know what is going on
            // - it's simply comparing all the values.
            if (currentState.scale === target.scale ||
                (currentState.rotate.x === target.rotate.x && currentState.rotate.y === target.rotate.y &&
                    currentState.rotate.z === target.rotate.z && currentState.translate.x === target.translate.x &&
                    currentState.translate.y === target.translate.y && currentState.translate.z === target.translate.z)) {
                delay = 0;
            }

            // store current state
            currentState = target;
            activeStep = el;

            // And here is where we trigger `impress:stepenter` event.
            // We simply set up a timeout to fire it taking transition duration (and possible delay) into account.
            //
            // I really wanted to make it in more elegant way. The `transitionend` event seemed to be the best way
            // to do it, but the fact that I'm using transitions on two separate elements and that the `transitionend`
            // event is only triggered when there was a transition (change in the values) caused some bugs and
            // made the code really complicated, cause I had to handle all the conditions separately. And it still
            // needed a `setTimeout` fallback for the situations when there is no transition at all.
            // So I decided that I'd rather make the code simpler than use shiny new `transitionend`.
            //
            // If you want learn something interesting and see how it was done with `transitionend` go back to
            // version 0.5.2 of impress.js: http://github.com/bartaz/impress.js/blob/0.5.2/js/impress.js
            window.clearTimeout(stepEnterTimeout);
            stepEnterTimeout = window.setTimeout(function() {
                onStepEnter(activeStep);
            }, duration + delay);

            return el;
        };

        // `prev` API function goes to previous step (in document order)
        var prev = function() {
            var prev = steps.indexOf(activeStep) - 1;
            prev = prev >= 0 ? steps[prev] : steps[steps.length - 1];

            return goto(prev);
        };

        // `next` API function goes to next step (in document order)
        var next = function() {
            var next = steps.indexOf(activeStep) + 1;
            next = next < steps.length ? steps[next] : steps[0];

            return goto(next);
        };

        // Adding some useful classes to step elements.
        //
        // All the steps that have not been shown yet are given `future` class.
        // When the step is entered the `future` class is removed and the `present`
        // class is given. When the step is left `present` class is replaced with
        // `past` class.
        //
        // So every step element is always in one of three possible states:
        // `future`, `present` and `past`.
        //
        // There classes can be used in CSS to style different types of steps.
        // For example the `present` class can be used to trigger some custom
        // animations when step is shown.
        root.addEventListener("impress:init", function() {
            // STEP CLASSES
            steps.forEach(function(step) {
                step.classList.add("future");
            });

            root.addEventListener("impress:stepenter", function(event) {
                event.target.classList.remove("past");
                event.target.classList.remove("future");
                event.target.classList.add("present");
            }, false);

            root.addEventListener("impress:stepleave", function(event) {
                event.target.classList.remove("present");
                event.target.classList.add("past");
            }, false);

        }, false);

        // Adding hash change support.
        root.addEventListener("impress:init", function() {

            // last hash detected
            var lastHash = "";

            // `#/step-id` is used instead of `#step-id` to prevent default browser
            // scrolling to element in hash.
            //
            // And it has to be set after animation finishes, because in Chrome it
            // makes transtion laggy.
            // BUG: http://code.google.com/p/chromium/issues/detail?id=62820
            root.addEventListener("impress:stepenter", function(event) {
                window.location.hash = lastHash = "#/" + event.target.id;
            }, false);

            window.addEventListener("hashchange", function() {
                // When the step is entered hash in the location is updated
                // (just few lines above from here), so the hash change is
                // triggered and we would call `goto` again on the same element.
                //
                // To avoid this we store last entered hash and compare.
                if (window.location.hash !== lastHash) {
                    goto(getElementFromHash());
                }
            }, false);

            // START
            // by selecting step defined in url or first step of the presentation
            goto(getElementFromHash() || steps[0], 0);
        }, false);

        body.classList.add("impress-disabled");

        // store and return API for given impress.js root element
        return (roots["impress-root-" + rootId] = {
            init: init,
            goto: goto,
            next: next,
            prev: prev
        });

    };

    // flag that can be used in JS to check if browser have passed the support test
    impress.supported = impressSupported;

})(document, window);

// NAVIGATION EVENTS

// As you can see this part is separate from the impress.js core code.
// It's because these navigation actions only need what impress.js provides with
// its simple API.
//
// In future I think about moving it to make them optional, move to separate files
// and treat more like a 'plugins'.
(function(document, window) {
    'use strict';

    // throttling function calls, by Remy Sharp
    // http://remysharp.com/2010/07/21/throttling-function-calls/
    var throttle = function(fn, delay) {
        var timer = null;
        return function() {
            var context = this,
                args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function() {
                fn.apply(context, args);
            }, delay);
        };
    };

    // wait for impress.js to be initialized
    document.addEventListener("impress:init", function(event) {
        // Getting API from event data.
        // So you don't event need to know what is the id of the root element
        // or anything. `impress:init` event data gives you everything you
        // need to control the presentation that was just initialized.
        var api = event.detail.api;

        // KEYBOARD NAVIGATION HANDLERS

        // Prevent default keydown action when one of supported key is pressed.
        document.addEventListener("keydown", function(event) {
            if (event.keyCode === 9 || (event.keyCode >= 32 && event.keyCode <= 34) || (event.keyCode >= 37 && event.keyCode <= 40)) {
                event.preventDefault();
            }
        }, false);

        // Trigger impress action (next or prev) on keyup.

        // Supported keys are:
        // [space] - quite common in presentation software to move forward
        // [up] [right] / [down] [left] - again common and natural addition,
        // [pgdown] / [pgup] - often triggered by remote controllers,
        // [tab] - this one is quite controversial, but the reason it ended up on
        //   this list is quite an interesting story... Remember that strange part
        //   in the impress.js code where window is scrolled to 0,0 on every presentation
        //   step, because sometimes browser scrolls viewport because of the focused element?
        //   Well, the [tab] key by default navigates around focusable elements, so clicking
        //   it very often caused scrolling to focused element and breaking impress.js
        //   positioning. I didn't want to just prevent this default action, so I used [tab]
        //   as another way to moving to next step... And yes, I know that for the sake of
        //   consistency I should add [shift+tab] as opposite action...
        document.addEventListener("keyup", function(event) {
            if (event.keyCode === 9 || (event.keyCode >= 32 && event.keyCode <= 34) || (event.keyCode >= 37 && event.keyCode <= 40)) {
                switch (event.keyCode) {
                    case 33: // pg up
                    case 37: // left
                    case 38: // up
                        api.prev();
                        break;
                    case 9: // tab
                    case 32: // space
                    case 34: // pg down
                    case 39: // right
                    case 40: // down
                        api.next();
                        break;
                }

                event.preventDefault();
            }
        }, false);

        // delegated handler for clicking on the links to presentation steps
        document.addEventListener("click", function(event) {
            // event delegation with "bubbling"
            // check if event target (or any of its parents is a link)
            var target = event.target;
            while ((target.tagName !== "A") &&
                (target !== document.documentElement)) {
                target = target.parentNode;
            }

            if (target.tagName === "A") {
                var href = target.getAttribute("href");

                // if it's a link to presentation step, target this step
                if (href && href[0] === '#') {
                    target = document.getElementById(href.slice(1));
                }
            }

            if (api.goto(target)) {
                event.stopImmediatePropagation();
                event.preventDefault();
            }
        }, false);

        // delegated handler for clicking on step elements
        document.addEventListener("click", function(event) {
            var target = event.target;
            // find closest step element that is not active
            while (!(target.classList.contains("step") && !target.classList.contains("active")) &&
                (target !== document.documentElement)) {
                target = target.parentNode;
            }

            if (api.goto(target)) {
                event.preventDefault();
            }
        }, false);

        // touch handler to detect taps on the left and right side of the screen
        // based on awesome work of @hakimel: https://github.com/hakimel/reveal.js
        document.addEventListener("touchstart", function(event) {
            if (event.touches.length === 1) {
                var x = event.touches[0].clientX,
                    width = window.innerWidth * 0.3,
                    result = null;

                if (x < width) {
                    result = api.prev();
                } else if (x > window.innerWidth - width) {
                    result = api.next();
                }

                if (result) {
                    event.preventDefault();
                }
            }
        }, false);

        // rescale presentation when window is resized
        window.addEventListener("resize", throttle(function() {
            // force going to active step again, to trigger rescaling
            api.goto(document.querySelector(".step.active"), 500);
        }, 250), false);

    }, false);

})(document, window);

// THAT'S ALL FOLKS!
//
// Thanks for reading it all.
// Or thanks for scrolling down and reading the last part.
//
// I've learnt a lot when building impress.js and I hope this code and comments
// will help somebody learn at least some part of it.
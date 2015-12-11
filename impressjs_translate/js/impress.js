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
    // `css`方法将`props`对象里的所有样式应用到`el`元素里.它将每一个属性名都运行一次`pfx`
    // 方法以确保使用正确的前缀.
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
        // `initStep`方法根据给定的幻灯片元素以及通过它的data属性读取它的数据来初始化幻
        // 灯片并设置对应的样式.
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
        // `init` API 方法用于初始化(以及运行)整个演示文稿.
        var init = function() {
            if (initialized) {
                return;
            }

            // First we set up the viewport for mobile devices.
            // For some reason iPad goes nuts when it is not done properly.
            // 首先我们设置一下移动设备上的视图(viewport).
            // 由于某种原因,当设置得不恰当的时候在iPad上会出现问题.
            var meta = $("meta[name='viewport']") || document.createElement("meta");
            meta.content = "width=device-width, minimum-scale=1, maximum-scale=1, user-scalable=no";
            if (meta.parentNode !== document.head) {
                meta.name = 'viewport';
                document.head.appendChild(meta);
            }

            // initialize configuration object
            // 初始化配置选项对象
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
            // 用"canvas"元素(实际上不是canvas标签,而是一个普通的div标签而已)将所有
            // 的幻灯片包裹起来
            arrayify(root.childNodes).forEach(function(el) {
                canvas.appendChild(el);
            });
            root.appendChild(canvas);

            // set initial styles
            // 设置初始样式
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
            // 获取并初始化幻灯片
            steps = $$(".step", root);
            steps.forEach(initStep);

            // set a default initial state of the canvas
            // 给canvas(就是那个canvas变量,一个div标签)设置默
            // 认的初始化状态
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
        // `getStep`是一个工具方法,它根据所给的参数返回对应的幻灯片元素.
        // 如果给的参数是一个数字,那么将会返回对应索引的幻灯片元素,如果给的参数是一个字符串,那么将会返回对应id的
        // 幻灯片元素,如果给的参数是一个正确的DOM元素,那么将会直接返回这个元素(会检测是不是幻灯片元素的).
        var getStep = function(step) {
            if (typeof step === "number") {
                step = step < 0 ? steps[steps.length + step] : steps[step];
            } else if (typeof step === "string") {
                step = byId(step);
            }
            return (step && step.id && stepsData["impress-" + step.id]) ? step : null;
        };

        // used to reset timeout for `impress:stepenter` event
        // 用于重置`impress:stepenter`事件的超时时间
        var stepEnterTimeout = null;

        // `goto` API function that moves to step given with `el` parameter (by index, id or element),
        // with a transition `duration` optionally given as second parameter.
        // `goto`API方法根据`el`参数(可以是幻灯片的索引,id号或者幻灯片元素)跳转到对应的幻灯片,并且可以通过传一个
        // 可选参数`duration`(作为第二参数)来设置切换幻灯片的过渡时间.
        var goto = function(el, duration) {

            if (!initialized || !(el = getStep(el))) {
                // presentation not initialized or given element is not a step
                // 演示文稿未初始化或所给的元素不是幻灯片时返回失败
                return false;
            }

            // Sometimes it's possible to trigger focus on first link with some keyboard action.
            // Browser in such a case tries to scroll the page to make this element visible
            // (even that body overflow is set to hidden) and it breaks our careful positioning.
            // 有时候可能会因为一些键盘的动作而触发第一个链接的focus事件.
            // 浏览器在这种情况下会尽可能地滚动页面来让这个元素(就是那个链接)可见(就算body标签的overflow属性
            // 已经设置为hidden)并且破坏我们一直小心对待的定位.
            //
            // So, as a lousy (and lazy) workaround we will make the page scroll back to the top
            // whenever slide is selected
            // 所以,一种比较糟糕(而且懒)的做法是不管什么时候选中一张幻灯片时都将页面滚动到顶部
            //
            // If you are reading this and know any better way to handle it, I'll be glad to hear about it!
            // 如果你看到这里之后有更好的解决方法,请告诉我,我非常乐意聆听!
            window.scrollTo(0, 0);

            var step = stepsData["impress-" + el.id];

            if (activeStep) {
                activeStep.classList.remove("active");
                body.classList.remove("impress-on-" + activeStep.id);
            }
            el.classList.add("active");

            body.classList.add("impress-on-" + el.id);

            // compute target state of the canvas based on given step
            // 根据给定的幻灯片计算canvas的实时状态(目标状态)
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
            // 检测接下来的幻灯片切换效果是放大还是缩小.
            //
            // This information is used to alter the transition style:
            // when we are zooming in - we start with move and rotate transition
            // and the scaling is delayed, but when we are zooming out we start
            // with scaling down and move and rotation are delayed.
            // 这个信息(zoomin)用来修改过渡的样式:
            // 当过渡效果是放大时 - 我们先进行移动和旋转然后才进行放大,但当过渡效果是缩小时,
            // 我们先进行缩小和移动然后才进行旋转.
            var zoomin = target.scale >= currentState.scale;

            duration = toNumber(duration, config.transitionDuration);
            var delay = (duration / 2);

            // if the same step is re-selected, force computing window scaling,
            // because it is likely to be caused by window resize
            // 如果选中的是当前的幻灯片,则强制执行`computeWindowScale`方法重新计算一次
            // 缩放系数,因为这有可能是因为调整窗口大小而导致的(导致goto到同一张幻灯片这个
            // 行为发生)
            if (el === activeStep) {
                windowScale = computeWindowScale(config);
            }

            var targetScale = target.scale * windowScale;

            // trigger leave of currently active element (if it's not the same step again)
            // 触发当前播放的幻灯片的离开事件(当前播放的幻灯片不是目标幻灯片时才会触发)
            if (activeStep && activeStep !== el) {
                onStepLeave(activeStep);
            }

            // Now we alter transforms of `root` and `canvas` to trigger transitions.
            // 现在我们来修改`root`和`canvas`的变形来触发过渡效果.
            //
            // And here is why there are two elements: `root` and `canvas` - they are
            // being animated separately:
            // `root` is used for scaling and `canvas` for translate and rotations.
            // Transitions on them are triggered with different delays (to make
            // visually nice and 'natural' looking transitions), so we need to know
            // that both of them are finished.
            // 这里就是为什么会有两个元素: `root`和`canvas`的原因 - 它们的动画是分开进行的:
            // `root`是用于缩放,而`canvas`是用于平移和旋转的.它们的过渡效果是在不同的延迟(时间)
            // 上触发的(为了让过渡效果在视觉上更有冲击力和更自然),所以我们需要知道它们是怎么运作的.
            css(root, {
                // to keep the perspective look similar for different scales
                // we need to 'scale' the perspective, too
                // 为了保持视角在各个缩放比下看起来都差不多
                // 我们需要对这个视角(perspective)也进行'缩放(scale)'
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
            // 这里开始是一个非常棘手的部分了...
            //
            // If there is no change in scale or no change in rotation and translation, it means there was actually
            // no delay - because there was no transition on `root` or `canvas` elements.
            // We want to trigger `impress:stepenter` event in the correct moment, so here we compare the current
            // and target values to check if delay should be taken into account.
            // 如果没有任何的缩放变化或没有任何的旋转和平移变化,那么意味着实际上没有任何的延迟 - 因
            // 为在`root`或`canvas`元素上没有任何的过渡效果.
            // 我们想要在一个正确的时间触发`impress:stepenter`事件,所以在这里我们比较当前状态
            // (current)和目标状态(target)的值来检测是否应该进行延迟.
            //
            // I know that this `if` statement looks scary, but it's pretty simple when you know what is going on
            // - it's simply comparing all the values.
            // 我知道,`if`语句看起来非常吓人,但当你清楚它是怎么运作的时候你会发现它是那么的简单 - 简
            // 单到仅仅只是将所有值进行了一次比较.(风趣的老外=_=)
            if (currentState.scale === target.scale ||
                (currentState.rotate.x === target.rotate.x && currentState.rotate.y === target.rotate.y &&
                    currentState.rotate.z === target.rotate.z && currentState.translate.x === target.translate.x &&
                    currentState.translate.y === target.translate.y && currentState.translate.z === target.translate.z)) {
                delay = 0;
            }

            // store current state
            // 保存当前状态
            currentState = target;
            activeStep = el;

            // And here is where we trigger `impress:stepenter` event.
            // We simply set up a timeout to fire it taking transition duration (and possible delay) into account.
            // 这里开始我们就要触发`impress:stepenter`事件了.
            // 我们简单地设置一个超时时间来执行它,同时把过渡时间(以及可能的延迟)也考虑在内.
            //
            // I really wanted to make it in more elegant way. The `transitionend` event seemed to be the best way
            // to do it, but the fact that I'm using transitions on two separate elements and that the `transitionend`
            // event is only triggered when there was a transition (change in the values) caused some bugs and
            // made the code really complicated, cause I had to handle all the conditions separately. And it still
            // needed a `setTimeout` fallback for the situations when there is no transition at all.
            // So I decided that I'd rather make the code simpler than use shiny new `transitionend`.
            // 我是真的很想让它变得更优雅.`transitionend`事件貌似是最好的解决方案了,但事实上我在
            // 两个单独的元素上都使用了过渡,而`transitionend`事件仅在只有一个过渡(并且值还要修改
            // 了)的情况下才能被触发,所以在实际情况下会造成一些bug并且让代码变得复杂,因而我还需要单
            // 独处理所有的可能情况.它还需要一个`setTimeout`回调函数来处理没有任何过渡的情况.
            // 所以我决定,我宁愿让代码更简单,也不愿用闪亮的新的'transitionend`.
            //
            // If you want learn something interesting and see how it was done with `transitionend` go back to
            // version 0.5.2 of impress.js: http://github.com/bartaz/impress.js/blob/0.5.2/js/impress.js
            // 如果你想要学习一些有趣的东西并且好奇到底使用`transitionend`时是怎么工作的,你可以回
            // 到impress.js的旧版本0.5.2去看看:http://github.com/bartaz/impress.js/blob/0.5.2/js/impress.js
            window.clearTimeout(stepEnterTimeout);
            stepEnterTimeout = window.setTimeout(function() {
                onStepEnter(activeStep);
            }, duration + delay);

            return el;
        };

        // `prev` API function goes to previous step (in document order)
        // `prev` API 方法可以跳转到上一张幻灯片(按照演示文稿的顺序)
        var prev = function() {
            var prev = steps.indexOf(activeStep) - 1;
            prev = prev >= 0 ? steps[prev] : steps[steps.length - 1];

            return goto(prev);
        };

        // `next` API function goes to next step (in document order)
        // `next` API 方法可以跳转到下一张幻灯片(按照演示文稿的顺序)
        var next = function() {
            var next = steps.indexOf(activeStep) + 1;
            next = next < steps.length ? steps[next] : steps[0];

            return goto(next);
        };

        // Adding some useful classes to step elements.
        // 增加一些有用的类到幻灯片元素里.
        //
        // All the steps that have not been shown yet are given `future` class.
        // When the step is entered the `future` class is removed and the `present`
        // class is given. When the step is left `present` class is replaced with
        // `past` class.
        // 所有的未播放幻灯片元素都会被赋予`future`类.
        // 当幻灯片播放时`future`类会被`present`类代替.当幻灯片离开时`present`类会被
        // `past`类代替.
        //
        // So every step element is always in one of three possible states:
        // `future`, `present` and `past`.
        // 所以每一张幻灯片肯定拥有以下三种可能状态的其一:
        // `future`, `present` 以及 `past`.
        //
        // There classes can be used in CSS to style different types of steps.
        // For example the `present` class can be used to trigger some custom
        // animations when step is shown.
        // (怀疑作者写了错别字,应该是these而不是there)这些类可以通过CSS添加样式到幻灯片中.
        // 举个例子,可以通过`present`类添加一些自定义动画(通过CSS3 animation),当幻灯片播
        // 放时就会播放这些动画.
        root.addEventListener("impress:init", function() {
            // STEP CLASSES
            // 幻灯片的类
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
        // 增加对锚值(hash)改变的情况的支持.
        root.addEventListener("impress:init", function() {

            // last hash detected
            // 检测(其实我觉得更应该用store,也就是保存)上一个进入的幻灯片元素的锚
            // 值(hash)
            var lastHash = "";

            // `#/step-id` is used instead of `#step-id` to prevent default browser
            // scrolling to element in hash.
            // 使用`#/step-id`来代替`#step-id`可以有效阻止浏览器的默认行为 -- 滚动到拥有对应
            // 锚的元素处.
            //
            // And it has to be set after animation finishes, because in Chrome it
            // makes transtion laggy.
            // 而且它必须在动画结束后才能被设置,因为在Chrome浏览器里它会导致过渡变得卡卡的.(怀疑
            // 作者又写了个错别字,应该是transition而不是transtion)
            // BUG: http://code.google.com/p/chromium/issues/detail?id=62820
            root.addEventListener("impress:stepenter", function(event) {
                window.location.hash = lastHash = "#/" + event.target.id;
            }, false);

            window.addEventListener("hashchange", function() {
                // When the step is entered hash in the location is updated
                // (just few lines above from here), so the hash change is
                // triggered and we would call `goto` again on the same element.
                // 当幻灯片播放时URL上的hash就会被更新(就发生在上面的几行代码里),所以
                // `hasnchange`事件就会被触发并且会再次执行`goto`方法跳转到同一个幻
                // 灯片元素.
                //
                // To avoid this we store last entered hash and compare.
                // 为了避免发生这样的事情,我们保存了上一个进入的幻灯片元素的锚值(hash)
                // 并且进行比较.
                if (window.location.hash !== lastHash) {
                    goto(getElementFromHash());
                }
            }, false);

            // START
            // by selecting step defined in url or first step of the presentation
            // 从在URL上查找出的已定义的幻灯片或演示文稿的第一张幻灯片开始
            goto(getElementFromHash() || steps[0], 0);
        }, false);

        body.classList.add("impress-disabled");

        // store and return API for given impress.js root element
        // 保存并返回给定的impress.js根元素的API
        return (roots["impress-root-" + rootId] = {
            init: init,
            goto: goto,
            next: next,
            prev: prev
        });

    };

    // flag that can be used in JS to check if browser have passed the support test
    // 如果浏览器通过了兼容性测试就做个标记,代表JS都能正常运行
    impress.supported = impressSupported;

})(document, window);

// NAVIGATION EVENTS
// 导览事件

// As you can see this part is separate from the impress.js core code.
// It's because these navigation actions only need what impress.js provides with
// its simple API.
// 正如你所见,这一部分和impress.js核心代码是完全独立开来的.
// 因为这些导览操作仅仅需要impress.js提供API支持.
//
// In future I think about moving it to make them optional, move to separate files
// and treat more like a 'plugins'.
// 我在考虑以后将这部分变成可选的,并且移到一个单独的文件里,让它表现得更像一个'插件'.
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
    // 在impress.js初始化时会运行以下代码
    document.addEventListener("impress:init", function(event) {
        // Getting API from event data.
        // So you don't event need to know what is the id of the root element
        // or anything. `impress:init` event data gives you everything you
        // need to control the presentation that was just initialized.
        // 从event对象里获取API
        // 所以你甚至不需要知道根元素的id号或者什么其它东西(貌似作者又冒出了一个错别字,是
        // even而不是event).`impress:init`事件对象会给你一切你需要用来控制当前被初始化
        // 的演示文稿的东西.
        var api = event.detail.api;

        // KEYBOARD NAVIGATION HANDLERS
        // 键盘导览事件

        // Prevent default keydown action when one of supported key is pressed.
        // 当其中一个被支持的有特定功能的键按下时阻止浏览器的默认行为.
        document.addEventListener("keydown", function(event) {
            if (event.keyCode === 9 || (event.keyCode >= 32 && event.keyCode <= 34) || (event.keyCode >= 37 && event.keyCode <= 40)) {
                event.preventDefault();
            }
        }, false);

        // Trigger impress action (next or prev) on keyup.
        // 绑定impress操作(next或prev)到keyup事件上.

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
        // 支持的按键有:
        // [space] - 在演示文稿软件(比如PPT,Keynote那些)里面十分常见,表示跳转到下一页
        // [up] [right] / [down] [left] - 再普通不过的箭头了,
        // [pgdown] / [pgup] - 一些有年代感的遥控器经常用到这两个键,
        // [tab] - 这个按键是比较有争议性的,但它能出现在这个列表里,在背后是有一个相当有趣
        //   的故事的...还记得在impress.js的代码里有一个奇怪的部分吗?在那里,每切换到一张
        //   幻灯片时都需要将页面滚动到最顶端,因为浏览器有时候会滚动到一些获得焦点的元素的
        //   可视区域.好吧,[tab]键默认就可以在那些可设定焦点的元素之间切换,所以经常点击它
        //   们会导致页面不断滚动到那些获得焦点的元素的位置而破坏了impress.js的定位.我不
        //   想仅仅只是阻止这个默认行为,所以我将[tab]键作为另一种切换到下一张幻灯片的途径...
        //   是的,我知道,为了满足一致性,我应该添加[shift+tab]作为它的相反的操作(也就是切
        //   换到上一张幻灯片)...(那为毛不加?是因为作者懒吗?=_=)
        document.addEventListener("keyup", function(event) {
            if (event.keyCode === 9 || (event.keyCode >= 32 && event.keyCode <= 34) || (event.keyCode >= 37 && event.keyCode <= 40)) {
                switch (event.keyCode) {
                    case 33: // pgup
                    case 37: // left
                    case 38: // up
                        api.prev();
                        break;
                    case 9: // tab
                    case 32: // space
                    case 34: // pgdown
                    case 39: // right
                    case 40: // down
                        api.next();
                        break;
                }

                event.preventDefault();
            }
        }, false);

        // delegated handler for clicking on the links to presentation steps
        // 为指向演示文稿幻灯片的链接的点击事件设置一个事件代理处理程序
        document.addEventListener("click", function(event) {
            // event delegation with "bubbling"
            // check if event target (or any of its parents is a link)
            // 通过"bubbling"(冒泡)实现事件代理
            // 检查是否是事件对象(或者是它的父元素的任意一个链接)
            var target = event.target;
            while ((target.tagName !== "A") &&
                (target !== document.documentElement)) {
                target = target.parentNode;
            }

            if (target.tagName === "A") {
                var href = target.getAttribute("href");

                // if it's a link to presentation step, target this step
                // 如果它是一个指向演示文稿幻灯片的链接,则直接将该幻灯片设置为目标
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
        // 为幻灯片元素的点击事件设置一个事件代理处理程序
        document.addEventListener("click", function(event) {
            var target = event.target;
            // find closest step element that is not active
            // 找到最近的一个没有在播放的幻灯片元素
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
        // 为在屏幕左侧以及右侧触屏单击操作设置一个事件代理处理程序
        // 基于@hakimel的一个好作品: https://github.com/hakimel/reveal.js
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
        // 当窗口大小改变了就重新缩放演示文稿
        window.addEventListener("resize", throttle(function() {
            // force going to active step again, to trigger rescaling
            // 为了重新缩放,强制再次跳转到当前播放的幻灯片
            api.goto(document.querySelector(".step.active"), 500);
        }, 250), false);

    }, false);

})(document, window);

// THAT'S ALL FOLKS!
// 这是本文的最后了!
//
// Thanks for reading it all.
// Or thanks for scrolling down and reading the last part.
// 感谢你阅读完全文.
// 或者感谢你滚动到底部然后看到最后这一部分.(=_=)
//
// I've learnt a lot when building impress.js and I hope this code and comments
// will help somebody learn at least some part of it.
// 在我编写impress.js的时候我真的学到了非常多,希望这些代码以及注释能够帮助到别人,即使是只学
// 了其中一部分.
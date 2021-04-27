/* eslint-disable no-console */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
(async () => {

    const $this = {
        appVersion: '0.1a-2',
        changelog: {
            '0.1a': [
                '07/03/2021: Initialization.',
            ],
        },
        scripts: [
            '3th/md5.min.js',
            'scripts/theme.js',
            'scripts/themeview.js'
        ],
        styles: {
        },
        options: {
            debug: {},
        },
        init: async () => {
            try {
                $this.kernel = window.kernel
                delete window.kernel

                const isChromium = window.chrome;
                const winNav = window.navigator;
                const vendorName = winNav.vendor;
                const isOpera = winNav.userAgent.indexOf('OPR') > -1;
                const isIEedge = winNav.userAgent.indexOf('Edge') > -1;
                const isIOSChrome = winNav.userAgent.match('CriOS');
                const isAndroid = winNav.userAgent.toLowerCase().indexOf('mobile') > -1 && winNav.userAgent.toLowerCase().indexOf('android') > -1;

                if (isIOSChrome) {
                    // is Google Chrome on IOS
                    this.weareOnChrome = true;
                } else if (isChromium !== null && isChromium !== undefined && vendorName === 'Google Inc.' && isOpera === false && isIEedge === false) {
                    // is Google Chrome
                    this.weareOnChrome = true;
                } else {
                    // not Google Chrome

                    /* $("body").css("background-color", "#FFF");
            $("body").css("color", "#000");
            $("body").html("<h1>Attenzione: Questa applicazione può girare solo se utilizzi Chrome o Chromium su un PC Desktop.</h1>");
            return; */
                }

                let options = $('[data-core-options]').attr('data-core-options');
                if (options) {
                    options = JSON.parse(options);
                } else {
                    options = {}
                }

                options = await $this.kernel.applicationStart(options)
                for (const i in options) {
                    if (Object.prototype.hasOwnProperty.call(options, i)) {
                        $this.options[i] = options[i];
                    }
                }

                log('Initialized with options');
                log($this.options);

                //await waitFor(() => Theme && ThemeView) //exists theme class!
                $this.splash();
            } catch (err) {
                $this.kernel.criticalError(err)
            }
        },
        updateTitle: async (title) => {
            return $this.theme.updateTitle()
        },
        startTime: new Date().getTime(),
        _rootUrl: undefined,
        rootUrl: () => {
            if (!this._rootUrl) {
                if ($('script[src*=\'core.js\']').length > 0) {
                    this._rootUrl = $('script[src*=\'core.js\']').attr('src').split('?')[0].split('core.js')[0] + '../';
                } else {
                    this._rootUrl = this.options.root;
                }
            }
            return this._rootUrl;
        },
        rootVersionUrl: function(url) {
            return this.versionUrl($this.rootUrl() + url);
        },
        rootUnVersionUrl: function(url) {
            return this.rootUrl() + url;
        },
        versionUrl: function(url) {
            let postanchor = null;
            if (url.indexOf('#') > -1) {
                postanchor = '#' + url.split('#')[1];
                url = url.split('#')[0];
            }

            if (url.indexOf('&v=') === -1 && url.indexOf('?v=') === -1) {
                if (url.indexOf('?') === -1) {
                    url += '?';
                } else {
                    url += '&';
                }
                url += 'v=' + this.appVersion;
            }
            if ($this.options.debug.version) {
                if (url.indexOf('?') === -1) {
                    url += '?';
                } else {
                    url += '&';
                }
                url += 'vt=' + this.startTime;
            }
            if (postanchor) {
                url += postanchor;
            }
            return url;
        },
        logError: function() {

            if ($this.kernel) {
                const margs = Array.from(arguments)
                $this.kernel.logRawEx(
                    level = 'E', //error
                    sender = margs.shift(),
                    args = margs
                )
            }
            arguments[0] = `{${arguments[0]}}`
            if ($this._lastLog == -1) {
                $this._lastLog = getTickCount()
            }
            const diff = getTickCount() - $this._lastLog
            $this._lastLog = getTickCount()
            Array.push?.call(arguments, diff + 'ms');
            let console = this.console;
            if (!console) {
                console = window.console;
            }
            if (console !== undefined) {
                if (console != null) {
                    console.error.apply(console, arguments);
                }
            }
        },
        _lastLog: -1,
        log: function() {
            if ($this.kernel) {
                const margs = Array.from(arguments)

                $this.kernel.logRawEx(
                    level = 'I', //error
                    sender = margs.shift(),
                    args = margs
                )
            }
            if ($this._lastLog == -1) {
                $this._lastLog = getTickCount()
            }
            const diff = getTickCount() - $this._lastLog
            $this._lastLog = getTickCount()
            arguments[0] = `{${arguments[0]}}`
            arguments[arguments.length] = '+' + diff + 'ms';
            arguments.length++
            //arguments.unshift(diff + 'ms')
            let console = this.console;
            if (!console) {
                console = window.console;
            }
            if (console !== undefined) {
                if (console != null) {
                    if ($this.options && $this.options.log && $this.options.log.trace) {
                        console.groupCollapsed.apply(console, arguments);
                        //console.trace("Stacktrace");
                        const trace = new Error().stack.split('\n')
                        trace.splice(0, 3)
                        console.log(trace.join('\n'))
                        console.groupEnd();
                    }
                    else
                        console.log.apply(console, arguments);
                }
            }
        },
        loadJSON: async (url) => {
            if ($this.options.log.loadjson) {
                log('Load JSON', url)
            }
            return new Promise(resolve => {
                $.get(
                    core.versionUrl(url)
                ).done(function(obj) {
                    if (typeof obj === 'string' || obj instanceof String) {
                        obj = JSON.parse(obj);
                    }
                    if ($this.options.log.loadjson) {
                        log('Loaded JSON', url)
                    }
                    resolve(obj);
                }).fail(function(obj) {
                    //log(obj);
                    try {
                        log(eval(obj.responseText));
                    } catch (ex) {
                        log('Error while parsing ' + core.versionUrl(url) + ': ' + ex);
                        eval(obj.responseText);
                    }
                    throw new Error('Error while parsing ' + core.versionUrl(url));
                });
            })
        },
        loadedjs: {},
        loadJS: async (urls, controls) => {
            return new Promise(resolve => {
                if (!Array.isArray(urls)) {
                    urls = [urls];
                }
                const s = document.getElementsByTagName('head')[0];
                let toload = urls.length;
                for (let h = 0; h < urls.length; h++) {
                    const url = urls[h]
                    if ($this.options.log.loadjs) {
                        log('Load JS', url)
                    }
                    const ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = false;
                    $(ga).on('load', () => {
                        if ($this.options.log.loadjs) {
                            log('Loaded JS', url)
                        }
                        toload--;
                    });
                    ga.src = $this.versionUrl(urls[h]);
                    s.appendChild(ga);
                }

                waitFor(() => {
                    const ret = toload === 0;
                    if (!controls || !ret) {
                        return ret;
                    }

                    let tot = 0;
                    $.each(controls, function(idx, cnt) {
                        if (!cnt || ('' + cnt).length === 0) {
                            return;
                        }
                        tot++;
                        if ($this.loadedjs[cnt]) {
                            tot--;
                        }
                    });

                    return tot === 0;
                }).then(resolve);
            })
        },
        loadCSS: async (urls, idselector4load) => {
            return new Promise(resolve => {
                let ga;
                let toload = urls.length;
                for (let i = 0; i < urls.length; i++) {
                    const url = urls[i];
                    const idsel = idselector4load[i];
                    if ($this.options.log.loadcss) {
                        log('Load CSS', url)
                    }
                    if ($('#csscontroller').find('#' + idsel).length == 0) {
                        $('#csscontroller').append('<div id=\'' + idsel + '\'></div>');
                    }
                    const s = document.getElementsByTagName('head')[0];
                    ga = document.createElement('link'); ga.type = 'text/css'; ga.async = false;
                    ga.setAttribute('rel', 'stylesheet');
                    waitFor(() => {
                        return $('#csscontroller #' + idsel).innerWidth() === 100;
                    }).then(() => {
                        toload--;
                        if ($this.options.log.loadcss) {
                            log('Loaded CSS', url)
                        }
                        if (toload == 0) {
                            resolve()
                        }
                    });
                    ga.href = $this.versionUrl(url);
                    ga.setAttribute('data-src', url);
                    s.appendChild(ga);
                }
            })
        },
        loadImages: async (urls) => {

            return new Promise(function(resolve, reject) {
                if (!Array.isArray(urls)) {
                    urls = [urls];
                }

                const imgs = [];

                for (const url of urls) {
                    const img = new Image();
                    if ($this.options.log.loadimages) {
                        log('Load Image', url)
                    }
                    img.src = core.versionUrl(url);
                    imgs.push(img);
                }
                const loaded = {}
                waitFor(() => {
                    let tot = 0;
                    for (const img of imgs) {
                        tot += img.naturalWidth > 0 ? 1 : 0;
                        if (img.naturalWidth > 0 && $this.options.log.loadimages && !loaded[img.src]) {
                            log('Loaded Image', img.src)
                            loaded[img.src] = true
                        }
                    }
                    return tot == imgs.length;
                }).then(resolve);
            });
        },
        splash: async () => {
            // preload splashimage

            try {
                let tot = $this.scripts.length
                for (const js of $this.scripts) {
                    $this.loadJS(js).then(() => tot--)
                }

                //await $this.loadCSS(Object.keys($this.styles), Object.values($this.styles))

                await waitFor(() => tot == 0)

                if (!$this.boolEval('Theme')) {
                    logError('Syntax error on theme. Check developer console.')
                    await $this.kernel.showWindow()
                    window.initialWindowAppeared = true
                    return
                }

                const thememanifest = await $this.loadJSON((await $this.kernel.getThemeUrl('manifest.json')))

                $this.theme = await Theme.create(thememanifest)

                await $this.theme.updateTitle()

                await $this.theme.onBeforeInitialShow()

                await $this.theme.onBeginViewShow();

                await $this.kernel.showWindow()

                window.initialWindowAppeared = true

                await $this.theme.onThemeAppeared()

                //await $this.
                //await $this.loadJSON()

            } catch (err) {
                $this.kernel.criticalError(err)
            }
        },
        onKernelEvent: function(type, args) {
            if (window.$) {
                //log('onKernelEvent', type)
                $(document).trigger('kernel.' + type, args)
            }
        },
        boolEval: function(text) {
            try {
                return eval(text) ? true : false
            } catch (err) {
                return false;
            }
        },
        exit: () => {
            $this.kernel.applicationExit();
        },
        getUID: function(id) {
            if (!id) {
                id = '_';
            }
            // eslint-disable-next-line new-cap
            const uid = md5('' + getTickCount() + id + $this.cyclecount);
            $this.cyclecount++;
            if ($this.cyclecount > 10000) {
                $this.cyclecount = 0;
            }
            return uid;
        },
        getParentOf: function(cnt, parentselector) {
            let ret = $(cnt).parent();
            if (ret.is(parentselector)) {
                return ret.first();
            }
            ret = $(cnt).parentsUntil(parentselector).parent();
            if (ret.is(parentselector)) {
                return ret.first();
            }
            return null;
        },
        overrideTheme: function(obj) {
            const parent = $this.theme
            $this.theme = obj
            for (const prop in parent) {
                if ($this.theme[prop] === undefined) {
                    if (isFunction(parent[prop], true)) {
                        $this.theme[prop] = async function() {
                            return parent[prop].apply(parent[prop], arguments)
                        }
                    } else if (isFunction(parent[prop])) {
                        $this.theme[prop] = function() {
                            return parent[prop].apply(parent[prop], arguments)
                        }
                    }
                }
            }
            return parent
        }
    };
    window.initialWindowAppeared = false
    window.core = $this;
    const log = function() {
        const margs = Array.from(arguments)
        margs.unshift('Core')
        $this.log.apply($this, margs)
    }
    const logError = function() {
        const margs = Array.from(arguments)
        margs.unshift('Core')
        $this.logError.apply($this, margs)
    }
    // eslint-disable-next-line camelcase
    window.waitFor = async (stringVariable_orCallback) => {
        if (typeof stringVariable_orCallback == "string" && stringVariable_orCallback.length == 0) {
            const err = new Error("Empty stringVariable_orCallback passed.")
            logError(err)
            throw err;
        }
        const pErr = new Error('Timeout ' + $this.options.initialWindowAppearTimeout + ' appstart in waitFor. ' + stringVariable_orCallback)
        return new Promise(resolve => {
            const deftimeout = 1;
            let timer
            timer = setInterval(() => {
                if (getPassedTick() > $this.options.initialWindowAppearTimeout && !window.initialWindowAppeared) {
                    log('#### Initial window is not appear for 5 seconds.')
                    log(' Process is waiting for:', stringVariable_orCallback)
                    logError(pErr)
                    clearInterval(timer)
                    $this.kernel.showWindow()
                    return;
                }
                let allok = false
                // eslint-disable-next-line camelcase            
                if (typeof stringVariable_orCallback === 'string') {
                    const totvars = stringVariable_orCallback.split(',');
                    allok = true
                    for (let i = 0; i < totvars.length; i++) {
                        try {
                            const ev = eval(totvars[i]);
                            allok = ev ? true : false
                            if (!allok) {
                                allok = false
                                break
                            }
                        } catch (Err) {
                            logError(Err + '. ' + pErr.stack)
                            clearInterval(timer)
                            return
                        }
                    }
                } else {
                    try {
                        allok = stringVariable_orCallback()
                    } catch (Err) {
                        allok = false
                        logError(Err + '. ' + pErr.stack)
                        clearInterval(timer)
                        return
                    }
                }
                if (allok) {
                    resolve()
                    clearInterval(timer)
                    return;
                }
            }, deftimeout)
        })
    };


    if (!Array.prototype.shuffle) {
        // eslint-disable-next-line no-extend-native
        Array.prototype.shuffle = function() {
            const array = this
            let currentIndex = array.length; let temporaryValue; let randomIndex;

            // While there remain elements to shuffle...
            while (currentIndex !== 0) {
                // Pick a remaining element...
                randomIndex = Math.floor($this.random() * currentIndex);
                currentIndex -= 1;

                // And swap it with the current element.
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }

            return array;
        }
    }

    window.formatTime = (ticks, removeseconds) => {
        ticks = ticks / 1000;
        const days = Math.floor(ticks / 86400);
        // After deducting the days calculate the number of hours left
        const hours = Math.floor((ticks - (days * 86400)) / 3600);
        // After days and hours , how many minutes are left
        const minutes = Math.floor((ticks - (days * 86400) - (hours * 3600)) / 60);
        // Finally how many seconds left after removing days, hours and minutes.
        const secs = Math.floor((ticks - (days * 86400) - (hours * 3600) - (minutes * 60)));

        let ret = '';
        if (days > 0) {
            ret += days + '.';
        }

        return ret += ('' + hours).padStart(2, '0') + ':' + ('' + minutes).padStart(2, '0') + (!removeseconds ? (':' + ('' + secs).padStart(2, '0')) : '');
    }

    window.isFunction = (functionToCheck, onlyasync) => {
        const getType = {};
        return functionToCheck && [onlyasync ? '[fakeme]' : '[object Function]', '[object AsyncFunction]'].indexOf(getType.toString.call(functionToCheck)) > -1;
    }

    if (!String.prototype.replaceAll) {
        // eslint-disable-next-line no-extend-native
        String.prototype.replaceAll = function(token, newToken, ignoreCase) {
            let str; let i = -1; let _token;
            if (newToken == undefined) {
                newToken = '';
            }
            if ((str = this.toString()) && typeof token === 'string') {
                _token = ignoreCase === true ? token.toLowerCase() : undefined;
                while ((i = (
                    _token !== undefined
                        ? str.toLowerCase().indexOf(
                            _token,
                            i >= 0 ? i + newToken.length : 0
                        ) : str.indexOf(
                            token,
                            i >= 0 ? i + newToken.length : 0
                        )
                )) !== -1) {
                    str = str.substring(0, i)
                        .concat(newToken)
                        .concat(str.substring(i + token.length));
                }
            }
            return str;
        };
    }

    window.getTickCount_initial = 0;
    window.getTickCount = () => {
        if (!window.getTickCount_initial)
            window.getTickCount_initial = new Date().getTime() - Math.floor(performance.now());
        return Math.floor(performance.now()) + window.getTickCount_initial;
    }
    window.getPassedTick = () => {
        return getTickCount() - getTickCount_initial;
    }

    window.waitForFinalEvent = (() => {
        const timers = {};
        return function(callback, ms, uniqueId) {
            if (!uniqueId) {
                uniqueId = 'Don\'t call this twice without a uniqueId';
            }
            if (timers[uniqueId]) {
                clearTimeout(timers[uniqueId]);
                delete timers[uniqueId];
            }
            timers[uniqueId] = setTimeout(callback, ms);
        };
    })();

    window.getQuerystring = (key, default_, source) => {
        if (!source) {
            source = document.location.href;
        }
        if (source.indexOf('?') == -1) {
            source = '?' + source;
        }
        // debugLog("getQuerystring from " + source);
        // if (default_==null) default_="";
        key = key.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + key + '=([^&#]*)');
        const qs = regex.exec(source);
        if (qs == null) {
            // debugLog("Null returned!");
            return default_;
        } else {
            return qs[1];
        }
    }

    window.getScreenCoordOf = (control) => {
        let e = $(control).get()[0];
        const offset = { x: 0, y: 0 };
        while (e) {
            offset.x += e.offsetLeft;
            offset.y += e.offsetTop;
            e = e.offsetParent;
        }
        return offset;
    };


    if (!String.format) {
        String.format = function(format, firstarg) {
            // eslint-disable-next-line prefer-rest-params
            let args = Array.prototype.slice.call(arguments, 1);
            if (firstarg != undefined && Array.isArray(firstarg)) {
                args = firstarg;
            }
            return format.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] !== 'undefined'
                    ? args[number]
                    : match;
            });
        };
    };

    (() => {

        const trim = function(source, chars) {
            if (!chars || chars.length == 0) {
                return defaultTrim.apply(source)
            }
            if (!Array.isArray(chars)) {
                chars = [chars]
            }
            for (let c of chars) {
                if (c === "]") c = "\\]";
                if (c === "\\") c = "\\\\";
                source = source.replace(new RegExp(
                    "^[" + c + "]+|[" + c + "]+$", "g"
                ), "");
            }
            return source
        }
        const defaultTrim = String.prototype.trim
        String.prototype.trim = function(chars) {
            return trim(this, chars)
        }

    })()


    await waitFor('window.$, window.kernel')
    core.init()
})();
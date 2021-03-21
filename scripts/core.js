/* eslint-disable no-console */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
(async () => {

    const $this = {
        appVersion: '0.1a-1',
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

                $(window).resize(() => {
                    $this.updateClientWindowSize();
                });

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


                // await (new Promise(resolve => setTimeout(resolve, 5000)))

                const onMouseUpdate = function(e) {
                    $this.mousepos.x = e.pageX;
                    $this.mousepos.y = e.pageY;
                };
                document.addEventListener('mousemove', onMouseUpdate, false);
                document.addEventListener('mouseenter', onMouseUpdate, false);

                // load jhspace
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
        mousepos: { x: 0, y: 0 },
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
        loadDB: function(url, cb) {
            $.get(
                core.versionUrl(url)
            ).done(function(obj) {
                try {
                    if (obj.indexOf('dbobj = ') === -1) {
                        throw new Error('DB File must starts with "dbobj = {".');
                    }
                    // eslint-disable-next-line prefer-const
                    let dbobj = undefined;
                    eval(obj);
                    cb(dbobj);
                } catch (ex) {
                    log('Error while parsing ' + core.versionUrl(url) + ': ' + ex);
                    log(obj);
                }
            }).fail(function(obj) {
                log(obj);
                try {
                    log(eval(obj.responseText));
                } catch (ex) {
                    log('Error while parsing ' + core.versionUrl(url) + ': ' + ex);
                    eval(obj.responseText);
                }
                throw new Error('Error while parsing ' + core.versionUrl(url));
            });
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
        _loader: undefined,
        showLoader: () => {
            if (!this._loader) {
                this._loader = new JHObject($('.app_container'), 'main_loader');
                this._loader.addClass('main_loader anim-spin anim-spin-ease');
            }
            this._loader.fadeIn();
        },
        hideLoader: () => {
            if (!this._loader) {
                return;
            }
            this._loader.fadeOut();
        },
        mouseButtonPressed: {
            left: false,
            middle: false,
            right: false
        },
        splash: async () => {
            // preload splashimage

            try {
                var leftButtonDown = false;
                $(document).mousedown(function(e) {
                    // Left mouse button was pressed, set flag
                    if (e.which === 1)
                        $this.mouseButtonPressed.left = true;
                    else if (e.which === 2)
                        $this.mouseButtonPressed.middle = true;
                    else if (e.which === 3)
                        $this.mouseButtonPressed.right = true;

                    //$this.log('Mouse button status', $this.mouseButtonPressed)
                });
                $(document).mouseup(function(e) {
                    // Left mouse button was released, clear flag
                    if (e.which === 1)
                        $this.mouseButtonPressed.left = false;
                    else if (e.which === 2)
                        $this.mouseButtonPressed.middle = false;
                    else if (e.which === 3)
                        $this.mouseButtonPressed.right = false;
                });

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

        updateClientWindowSize: () => {
            const win = {
                h: $(window).height(),
                w: $(window).width(),
            };
            $('.scalable').each(() => {
                const doc = {
                    h: $(this).height(),
                    w: $(this).width(),
                };

                if (win.h < doc.h) {
                    const scale = (win.h) / doc.h;
                    $(this).css('transform', 'scale(' + scale + ')');
                } else {
                    $(this).css('transform', 'none');
                }
            });
        },
        enableTooltip: function(control) {
            let wffe = false;
            if (!control) {
                control = document;
                wffe = true;
            }
            const fun = () => {
                if ($(control).tooltip('instance')) {
                    $(control).tooltip('destroy');
                }
                $(control).tooltip({
                    show: { effect: 'none', duration: 1 },
                    hide: { effect: 'none', duration: 1 },
                    items: '[title], [data-tooltip]',
                    content: () => {
                        if ($(this).attr('data-tooltip')) {
                            return $(this).attr('data-tooltip');
                        }
                        return $(this).prop('title');
                    },
                });
            };
            if (wffe) {
                waitForFinalEvent(fun, '100', 'enableTooltip');
            } else {
                fun();
            }
        },
        floatMessage: async (target, text, duration) => {
            return new Promise(resolve => {
                if (typeof target == 'string') {
                    target = $(target)
                }
                const msg = $('<div class="float-message">' + text + '</div>');
                $('body').append(msg);
                $this.onNewElementAdded(msg);
                msg.position({
                    of: target,
                    my: 'center bottom',
                    at: 'center top-10px',
                    collision: 'fit fit',
                });
                if (!duration) {
                    duration = 3000;
                }
                msg.css('animation-duration', duration + 'ms');
                setTimeout(() => {
                    msg.remove();
                    resolve()
                }, duration);
            })
        },
        lastView: undefined,
        showView: function(name, cb) {
            const cont = () => {
                $this.lastView = name;
                $this.showTemplate(name, () => {
                    $('html, body').removeClass('prevent-user-interactions');

                    if ($this.views[name].enablebackgroundMoveOnMouse) {
                        core.backgroundMoveOnMouse($this.views[name].content);
                    }

                    if (cb) {
                        cb();
                    }
                });
            };
            if ($this.lastView) {
                $this.hideCurrentView(cont);
            } else {
                cont();
            }
        },
        loadedTemplates: {},
        media: {},
        parseControl: function(control) {
            let changed = false;
            $(control)
                .contents()
                .filter(() => {
                    return this.nodeType === 3; // Node.TEXT_NODE
                }).each(() => {
                    const original = $(this).text();
                    const text = $this.parseText(original);

                    if (text != original) {
                        if (text.indexOf('<') == -1) {
                            this.nodeValue = text;
                        } else {
                            $(this).after(text);
                            $(this).remove();
                        }
                        changed = true;
                    }
                });
            $.each(control.get(0).attributes, () => {
                // this.attributes is not a plain object, but an array
                // of attribute nodes, which contain both the name and value
                if (this.specified) {
                    const original = this.value;
                    const text = $this.parseText(original);
                    if (text != original) {
                        // log("Change this.key from: " + original);
                        // log(" to: " + text);
                        this.value = text.replaceAll('&quot;', '"');
                        changed = true;
                    }
                }
            });

            if (changed) {
                $this.parseControl(control);
                return;
            }

            const children = $(control).children();
            children.each(() => {
                $this.parseControl($(this));
            });
        },
        boolEval: function(text) {
            try {
                return eval(text) ? true : false
            } catch (err) {
                return false;
            }
        },
        parseText: function(original) {
            let html = original;
            let count = 0;
            let memhtml = undefined;

            while (memhtml != html) {
                if (count++ > 1000) {
                    throw new Error('Too many cycles on core.parseControl');
                }
                memhtml = html;

                html = html.replace(/\$MSG\((.*?)\)/g, function(m, key, value) {
                    let args = key.split(',')
                    key = args.shift()
                    return String.format(core.language.getString(key), args);
                });

                html = html.replace(/\$BM\((.*?)\)/g, function(m, key, value) {
                    let args = key.split(',')
                    key = args.shift()
                    let malus = key.indexOf('-') == 0
                    if (args.length >= 1) {
                        malus = !malus
                    }
                    if (key >= 0) {
                        key = ('+' + key).replaceAll('++', '+')
                    }
                    if (malus) {
                        return '<span class="malus">' + key + '</span>';
                    } else {
                        return '<span class="bonus">' + key + '</span>';
                    }
                });

                html = html.replace(/\$BMH\((.*?)\)/g, function(m, key, value) {
                    let args = key.split(',')
                    key = args.shift()
                    let malus = key.indexOf('-') == 0
                    if (args.length >= 1) {
                        malus = !malus
                    }
                    if (key >= 0) {
                        key = ('+' + key).replaceAll('++', '+')
                    }
                    if (malus) {
                        return '<span class=&quot;malus&quot;>' + key + '</span>';
                    } else {
                        return '<span class=&quot;bonus&quot;>' + key + '</span>';
                    }
                });

                const rfun = function(m, key, value) {
                    let args = key.split(',');
                    let msgid = undefined;
                    let _class = '';
                    if (args.length > 1) {
                        msgid = args[1].trim();
                    }
                    if (args.length > 2) {
                        _class = args[2].trim();
                    }

                    const entryMsgId = msgid;

                    args = args[0].split(':');
                    const group = args[0].trim();
                    const type = args[1].trim();
                    const id = args[2] ? args[2].trim() : undefined;

                    const fullid = group + ':' + type + (id !== undefined ? (':' + id) : '');

                    if (msgid == undefined || msgid == '') {
                        msgid = 'sph_' + fullid.replaceAll(':', '_').trim();
                    } else if (msgid == 0) {
                        // nomsgid
                        msgid = '';
                    }

                    if ((type == 'affs' || type == 'traits') && id && id.length > 0 && id != '*') {
                        let nclass = type + '_';
                        if (type == 'affs') {
                            nclass += core.heroes.afflictions[id].source + '_' + core.heroes.afflictions[id].type;
                        } else if (type == 'traits') {
                            nclass += core.heroes.traits[id].type;
                        }
                        if ((' ' + _class + ' ').indexOf(' ' + nclass + ' ') == -1) {
                            if (_class) {
                                _class += ' ';
                            }
                            _class += nclass
                        }
                    }

                    let _tip = '';
                    if (group == 'places' && entryMsgId != 0) {
                        _tip = '$MSG(' + fullid.replaceAll(':', '_') + '_tooltip)';
                    }

                    let txt = (msgid ? (msgid.indexOf('$') == 0 ? msgid.substring(1) : core.language.getString(msgid)) : '')

                    return '<span ' + (_tip ? 'title="' + _tip.replaceAll('"', '&quot;') + '" ' : '') + 'class=\'' + _class + '\' data-sph=\'' + fullid + '\'><span class=\'text\'>' +
                        txt +
                        '</span></span>';
                };

                html = html.replace(/\$ICONH\((.*?)\)/g, rfun);
                html = html.replace(/\$ICON\((.*?)\)/g, rfun);
            }

            return html;
        },
        elementFuns: {
            click: () => {
                core.audio.play('btn_click');
            },
            hover: () => {
                core.audio.play('btn_over');
            },
            apply: () => {
                core.audio.play('btn_apply');
            },
            clicksnd: () => {
                core.audio.play($(this).attr('data-snd-onclick'));
            },
            hoversnd: () => {
                core.audio.play($(this).attr('data-snd-onover'));
                $(this).addClass('hovered');
            },
            hovered: () => {
                $(this).addClass('hovered');
            },
        },
        onNewElementAdded: function(object) {
            $this.parseControl(object);

            const fun = () => {
                $(this).attr('data-tooltip', $(this).attr('title'));
                $(this).removeAttr('title');
            };
            if (object.attr('title')) {
                fun(object);
            }
            object.find('[title]').each(fun);

            object.find('.button-snd').off('click', $this.elementFuns.click).on('click', $this.elementFuns.click);
            if (object.is('.button-snd')) {
                object.off('click', $this.elementFuns.click).on('click', $this.elementFuns.click);
            }

            object.find('.button-snd, .button-snd-over').off('mouseenter', $this.elementFuns.hover).on('mouseenter', $this.elementFuns.hover);
            if (object.is('.button-snd, .button-snd-over')) {
                object.off('mouseenter', $this.elementFuns.hover).on('mouseenter', $this.elementFuns.hover);
            }

            object.find('.button-snd-apply').off('click', $this.elementFuns.apply).on('click', $this.elementFuns.apply);
            if (object.is('.button-snd-apply')) {
                object.off('click', $this.elementFuns.apply).on('click', $this.elementFuns.apply);
            }

            object.find('[data-snd-onclick]').off('click', $this.elementFuns.clicksnd).on('click', $this.elementFuns.clicksnd);
            if (object.is('[data-snd-onclick]')) {
                object.off('click', $this.elementFuns.clicksnd).on('click', $this.elementFuns.clicksnd);
            }
            object.find('[data-snd-onover]').off('mouseenter', $this.elementFuns.hoversnd).on('mouseenter', $this.elementFuns.hoversnd);
            if (object.is('[data-snd-onover]')) {
                object.off('mouseenter', $this.elementFuns.hoversnd).on('mouseenter', $this.elementFuns.hoversnd);
            }

            object.find('.tutorial').off('mouseenter', $this.elementFuns.hovered).on('mouseenter', $this.elementFuns.hovered);
            if (object.is('.tutorial')) {
                object.off('mouseenter', $this.elementFuns.hovered).on('mouseenter', $this.elementFuns.hovered);
            }

            /* object.find("[data-sph]").each(function () {
                var types = $(this).attr("data-sph").split(':');
    
            });*/

            $this.enableTooltip();
        },
        views: {},
        showTemplate: function(key, cb) {
            const tpl = this.loadedTemplates[key];
            if (!tpl) {
                throw new Error('Missing template "' + key + '".');
            }
            const tplcont = new JHObject($('.app_container'), 'template_container');
            tplcont.addClass('template_container');
            tplcont.setAttr('data-jh-tpl', key);
            tplcont.object.html(tpl.html());

            $this.onNewElementAdded(tplcont.object);

            tplcont.object.css('opacity', 0);
            tplcont.object.show();

            $this.updateClientWindowSize();

            //tplcont.object.hide();
            //tplcont.object.css('opacity', 1);

            const cont = () => {

                tplcont.object.animate({
                    opacity: 1
                }, () => {
                    if ($this.views[key].showDone) {
                        $this.views[key].showDone(cont);
                    }
                    if (cb) {
                        cb();
                    }
                });
            };

            $this.views[key].content = $('[data-jh-tpl="' + key + '"]');

            if ($this.views[key].show) {
                $this.views[key].show(cont);
            } else {
                cont();
            }
        },
        enableInteractions: function(enable) {
            const prev = $('body').is('.disable-interaction')
            if (enable) {
                $('body').removeClass('disable-interaction');
            } else {
                $('body').addClass('disable-interaction');
            }
            log('enableInteractions from', !prev, enable)
            return !prev
        },
        exit: () => {
            $this.kernel.applicationExit();
        },
        showOptions: () => {
            $this.showWindowByTemplate('main_options', true);
        },
        showMessage: function(severity, msgid, oncreate, onclose) {
            $this.showWindowByTemplate('message', true, function(dialog) {
                $(dialog).addClass('severity-' + severity);
                $(dialog).find('.dialog-title').html('$ICON(gui:' + severity + ',0,msg_dlg_icon) $MSG(' + msgid + '_title)');
                $(dialog).find('.dialog-content').html('$MSG(' + msgid + '_text)');
                switch (severity) {
                    case 'alert':
                        $this.audio.play('message_fail');
                        break;
                }
                if (oncreate) {
                    oncreate(dialog);
                }
            }, onclose);
        },
        dialogs: {},
        openedDialogs: {},
        closeAllDialogs: () => {
            $.each(this.openedDialogs, function(uid, dialog) {
                $this.closeDialog(dialog.control.object);
            });
        },
        closeDialog: function(dialog, lastbuttonpressed) {
            const uid = dialog.attr('data-jh-uid');
            const info = $this.openedDialogs[uid];

            info.lastButtonPressed = lastbuttonpressed;

            const finaldel = function(parentcont) {
                if (info.onpostfadeclose) {
                    info.onpostfadeclose(dialog);
                }

                core.dialogs[info.key].close(dialog);
                parentcont.remove();

                delete $this.openedDialogs[uid];
                if (Object.keys($this.openedDialogs).length == 0) {
                    $('html').removeClass('dialog-visible');
                }
                // $this.enableTooltip();
            };

            if (Object.keys($this.openedDialogs).length == 1) {
                $('html').removeClass('dialog-visible');
            }

            if (info.onclose) {
                info.onclose(dialog);
            }

            if (core.dialogs[info.key].fadeOut) {
                core.dialogs[info.key].fadeOut(dialog)
            }

            if (info.modal) {
                info.maincont.addClass('disable-interaction');
                info.maincont.fadeOut(() => {
                    finaldel(this);
                });
            } else {
                dialog.addClass('disable-interaction');
                dialog.fadeOut(() => {
                    finaldel(this);
                });
            }

            $this.enableTooltip();
        },
        showWindowByTemplate: function(key, modal, oncreate, onclose, onpostfadeclose) {
            const tpl = this.loadedTemplates[key];

            $('html').addClass('dialog-visible');

            let maincont = $('.app_container');
            if (modal) {
                const back = new JHObject(maincont, 'modal_dialog_back_shadow');
                back.addClass('modal_dialog_back_shadow');
                maincont = back.object;
            }

            const dialog = new JHObject(maincont, 'dialog_' + key);
            dialog.addClass('dialog disable-interaction');
            dialog.setAttr('data-jh-tpl', key);
            const uid = $this.getUID();
            dialog.setAttr('data-jh-uid', uid);
            dialog.object.html(tpl.html());

            $this.openedDialogs[uid] = {
                control: dialog,
                key: key,
                modal: modal,
                onclose: onclose,
                onpostfadeclose: onpostfadeclose,
                maincont: maincont,
            };

            if (oncreate) {
                oncreate(dialog.object);
            }

            if (core.dialogs[key].show) {
                core.dialogs[key].show(dialog.object);
            }

            core.onNewElementAdded(dialog.object);

            dialog.object.find('.dialog-closebtn').click(() => {
                $this.closeDialog(dialog.object);
            });

            dialog.object.find('.dialog-buttons .button').click(() => {
                if (core.dialogs[key].click) {
                    if (!core.dialogs[key].click($(this))) {
                        return;
                    }
                }
                if ($(this).is('.closedialog')) {
                    $this.closeDialog(dialog.object, $(this));
                }
            });

            const endfun = () => {
                dialog.object.removeClass('disable-interaction');
                if (core.dialogs[key].showDone) {
                    core.dialogs[key].showDone(dialog.object);
                }
            };

            if (modal) {
                dialog.show();
                if (core.dialogs[key].showBegin) {
                    const olopacity = maincont.css('opacity');
                    maincont.css('opacity', 0);
                    maincont.show();
                    core.dialogs[key].showBegin(dialog.object, () => {
                        maincont.hide();
                        maincont.css('opacity', olopacity);
                        maincont.fadeIn(endfun);
                    });
                } else {
                    maincont.fadeIn(endfun);
                }
            } else {
                dialog.object.css('opacity', 0);
                dialog.show();
                if (core.dialogs[key].showBegin) {
                    core.dialogs[key].showBegin(dialog.object, () => {
                        dialog.hide();
                        dialog.object.css('opacity', 1);

                        dialog.fadeIn(endfun);
                    });
                } else {
                    dialog.hide();
                    dialog.object.css('opacity', 1);

                    dialog.fadeIn(endfun);
                }
            }
        },
        testTooltip: () => {
            $('[title]').first().tooltip({
                content: () => {
                    return $(this).prop('title');
                },
                offset: [0, 100],
            });
            $('[title]').first().tooltip('open');
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
        loadConfiguration: async () => {
            const config = await $this.loadData('config');

            if (!config) {
                return;
            } // nothing to load

            $.each(config.volumes, function(id, val) {
                if (id == 'master') {
                    core.audio.masterVolume = val;
                } else {
                    core.audio.volumes[id] = val;
                }
            });

            core.audio.updateVolumes();
        },
        saveConfiguration: () => {
            const config = {
                volumes: {},
            };
            $.each(core.audio.volumes, function(id, val) {
                config.volumes[id] = val;
            });
            config.volumes.master = core.audio.masterVolume;

            $this.storeData('config', config);
        },
        storeData: async function(filename, data) {

            return new Promise(resolve => {
                if (window.CBKernel) {
                    window.CBKernel.storeData(filename, JSON.stringify(data)).then(resolve)
                } else {
                    setTimeout(() => {
                        localStorage.setItem('DAS-' + filename, JSON.stringify(data))
                        resolve()
                    }, 10)
                }
            })
        },
        loadData: async function(filename) {
            return new Promise(resolve => {
                if (window.CBKernel) {
                    window.CBKernel.loadData(filename).then(data => {
                        log('Load data returns', data)
                        if (!data) {
                            resolve(undefined)
                        } else {
                            resolve(JSON.parse(data))
                        }
                    })
                } else {
                    resolve(JSON.parse(localStorage.getItem('DAS-' + filename)))
                }
            })
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
        hideCurrentView: function(cb) {
            if (!$this.lastView) {
                if (cb) {
                    cb();
                }
                return;
            }
            $('html, body').addClass('prevent-user-interactions');

            core.audio.fadeOutAll(400);

            $this.views[$this.lastView].content.fadeOut(() => {
                if ($this._backgroundMoveOnMouse_timer) {
                    clearInterval($this._backgroundMoveOnMouse_timer);
                }
                $this._backgroundMoveOnMouse_timer = 0;

                const cont = () => {
                    $this.views[$this.lastView].content.remove();

                    if (cb) {
                        cb();
                    }
                };
                if ($this.views[$this.lastView].hide) {
                    $this.views[$this.lastView].hide(cont);
                } else {
                    cont();
                }
            });
        },
        startNewGame: function(cb) {
            $this.showView('newgame', cb);
        },
        backToHome: function(cb) {
            $this.showView('home', cb);
        },
        enterInGame: function(cb) {
            core.audio.play('btn_begin');
            $this.showView('ingame', cb);
        },
        _backgroundMoveOnMouse_timer: 0,
        _backgroundMoveOnMouse_pos: { x: 0, y: 0 },
        _backgroundMoveOnMouse_actScale: 1,
        backgroundMoveOnMouse: function(content) {
            if (this._backgroundMoveOnMouse_timer) {
                clearInterval(this._backgroundMoveOnMouse_timer);
            }
            const bkg = content.find('.background');
            $this._backgroundMoveOnMouse_actScale = 1;

            this._backgroundMoveOnMouse_timer = setInterval(() => {
                if ($this._backgroundMoveOnMouse_actScale < 1.05) {
                    $this._backgroundMoveOnMouse_actScale += 0.001;
                }

                const scale = $this._backgroundMoveOnMouse_actScale;

                if ($this._backgroundMoveOnMouse_pos.x != core.mousepos.x || $this._backgroundMoveOnMouse_pos.y != core.mousepos.y) {
                    $this._backgroundMoveOnMouse_pos.x = core.mousepos.x;
                    $this._backgroundMoveOnMouse_pos.y = core.mousepos.y;

                    const bkgw = bkg.width() * ((1 - scale) / 2);
                    const bkgh = bkg.height() * ((1 - scale) / 2);

                    const mousex = $this._backgroundMoveOnMouse_pos.x / bkg.width() - 0.5;
                    const mousey = $this._backgroundMoveOnMouse_pos.y / bkg.height() - 0.5;

                    bkg.css('transform', 'scale(' + scale + ') translate(' + (mousex * bkgw) + 'px,' + (mousey * bkgh) + 'px)');

                    // bkg.css("left", (mousex * bkgw) + "px");
                    // bkg.css("top", (mousey * bkgh) + "px");
                } else if ($this._backgroundMoveOnMouse_actScale < 1.05) {
                    bkg.css('transform', 'scale(' + $this._backgroundMoveOnMouse_actScale + ')');
                }
            }, 10);
        },
        randomElement: function(array) {
            if (!array) {
                return undefined
            }
            if (!Array.isArray(array)) {
                array = Object.keys(array);
            }
            if (array.length == 0) {
                return undefined
            }
            const result = Math.floor($this.random() * array.length);
            return array[result];
        },
        random: function(val) { // 
            if (!val) {
                val = 1
            }
            if (!$this.random_core) {
                $this.random_core = new MersenneTwister();
            }
            return $this.random_core.random() * val
        },
        randomInt: function(min, max) { // min and max are included
            max++;
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor($this.random() * (max - min)) + min; // Il max è escluso e il min è incluso
        },
        randomWeight: function(hash, totw) {
            if (!totw) {
                totw = 0;
                $.each(hash, function(key, weight) {
                    totw += weight;
                });
            }
            let total = 0
            const randVal = $this.random() * totw
            let result = undefined
            $.each(hash, function(key, weight) {
                total += weight
                if (total >= randVal) {
                    result = key
                    return false
                }
            });
            return result;
        },
        randomElementByChances_caches: {},
        randomElementByChances_expire: function(uniqueid) {
            delete randomElementByChances_caches[uniqueid]
        },
        randomElementByChances: function(uniqueid, obj, evaluator) {
            let tot = 0
            let chances = {}
            if (!$this.randomElementByChances_caches[uniqueid]) {
                $.each(obj, (idx, elem) => {
                    const o = {}
                    o[idx] = elem
                    const chance = evaluator(o)
                    if (chance > 0) {
                        tot += chance
                        chances[idx] = {
                            o: o
                            , per: tot
                        }
                    }
                })
                $this.randomElementByChances_caches[uniqueid] = {
                    tot: tot,
                    chances: chances
                }
            } else {
                tot = $this.randomElementByChances_caches[uniqueid].tot
                chances = $this.randomElementByChances_caches[uniqueid].chances
            }

            const rnd = core.random() * Math.max(1, tot)
            let selected = undefined
            $.each(chances, function(idx, val) {
                if (rnd < val.per) {
                    selected = val.o
                    return false; //stop the cycle
                }
            })

            return selected
        },
        secureReplaceClass: function(cnt, _class) {
            cnt = $(cnt)
            if (!cnt.is('.' + _class)) {
                cnt.addClass(_class)
                return;
            }
            var newone = cnt[0].cloneNode(true);
            cnt[0].parentNode.replaceChild(newone, cnt[0]);
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
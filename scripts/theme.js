(async function() {
    const $this = {
        htmlpieces: {},
        jsloaded: {},
        onJSLoaded: (id, obj) => {
            if (obj === undefined) {
                return $this.jsloaded[id];
            } else {
                $this.jsloaded[id] = obj
            }
        },
        init: async (manifest) => {
            $this.manifest = manifest

            const jss = []
            const csss = []
            const csss_ctrl = []
            const towaitfor = []
            for (const tpl of manifest.templates) {
                const page = 'templates/' + tpl
                const js = await $this.themeUrl(page + '.js')
                if (js) {
                    jss.push(js)
                    towaitfor.push('core.theme.onJSLoaded(\'' + tpl + '\')')
                }
                const css = await $this.themeUrl(page + '.css')
                if (css) {
                    csss.push(css)
                    csss_ctrl.push(tpl + '_loaded')
                }
                const html = await $this.themeUrl(page + '.html')
                if (html) {
                    $this.htmlpieces[tpl] = $('<div></div>');
                    if (core.options.log.loadhtml) {
                        log('Load HTML', html)
                    }
                    await $this.htmlpieces[tpl].load(core.versionUrl(html))
                }
            }
            if (csss.length > 0) {
                await core.loadCSS(csss, csss_ctrl)
            }
            if (jss.length > 0) {
                await core.loadJS(jss)
                await waitFor(towaitfor.join(', '))
            }

            await $this.setPage(manifest.entry)

            log('Base Initialized')
        },
        themeUrl: async (relativePath) => {
            if (await core.kernel.existsThemeFile(relativePath)) {
                return core.kernel.getThemeUrl(relativePath)
            } else {
                return undefined
            }
        },
        updateTitle: async (title) => {
            $('head title').html(core.options.windowTitle + (title ? (' &bull; ' + title) : ''))
        },
        beginAppear: async () => {
            /* const back = new JHObject($('body'), 'app_container');
             back.addClass('app_container');
             $this.loadImages(['content/images/home_bkg.jpg'])
 
             back.setBackground('content/images/home_bkg.jpg')*/
        },
        appear: async () => {
            /*back.fadeIn().then(function() {
                core.showLoader();
                core.preloadAll().then(function() {
                    core.hideLoader();
                    core.loadConfiguration();
                    core.showView('home', function() {
                        back.setBackground(); // clear background
                        $this.enableTooltip();
                    });
                });
            });*/
        },
        setPage: async (pageid) => {

        }
    }
    core.theme = $this
    const log = function() {
        const margs = Array.from(arguments)
        margs.unshift(`Theme: ${$this.manifest.name}`)
        core.log.apply(core, margs)
    }
    const logError = function() {
        const margs = Array.from(arguments)
        margs.unshift(`Theme: ${$this.manifest.name}`)
        core.logError.apply(core, margs)
    }
})();
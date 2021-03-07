(async function() {
    const $this = {
        init: async (manifest) => {
            $this.manifest = manifest

            //await core.loadCSS(['content/main.css', 'content/animations.css'], ['main_loaded', 'anim_loaded'])

            log('Initialized.')
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
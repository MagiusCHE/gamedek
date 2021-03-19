(async function() {
    const $this = {        
        init: async (manifest) => {
            await $base.init(manifest);
            
            log('initialized')
        },
        updateTitle: async (subtitle) => {
            $base.updateTitle(subtitle)
        }
    }

    await waitFor('core.theme')

    const log = function() {
        const margs = Array.from(arguments)
        margs.unshift(`Theme: ${$base.manifest.name}`)
        core.log.apply(core, margs)
    }
    const logError = function() {
        const margs = Array.from(arguments)
        margs.unshift(`Theme: ${$base.manifest.name}`)
        core.logError.apply(core, margs)
    }

    const $base = core.overrideTheme($this);

    $this.isLoaded = true
})()
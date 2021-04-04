class myplugin extends global.Plugin {
    constructor(root, manifest) {
        super(root, manifest)
    }
    async init() {
        await super.init()
    }
    async getImportAction(actions) {
        if (!actions['gameengine']) {
            actions['gameengine'] = {}
        }
        actions['gameengine']['linux.import'] = {
            button: await kernel.translateBlock('${lang.ge_import_linux}'),
            short: await kernel.translateBlock('${lang.ge_import_linux_short}'),
            args: true
        }
    }
    async onButtonClick(action) {
        if (action != 'linux.import') {
            return
        }
        //kernel.guiEvent('')
    }
}

module.exports = myplugin

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
        actions['gameengine']['lutris.import'] = {
            button: await kernel.translateBlock('${lang.ge_import_lutris}'),
            short: await kernel.translateBlock('${lang.ge_import_lutris_short}'),
            args: true

        }
    }
    async onButtonClick(action) {
        if (action != 'lutris.import') {
            return
        }
        //kernel.guiEvent('')
    }
}

module.exports = myplugin

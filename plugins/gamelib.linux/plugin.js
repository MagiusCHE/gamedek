class myplugin extends global.Plugin {
    constructor(root, manifest) {
        super(root, manifest)
    }
    async init() {
        await super.init()
    }
    async getImportAction(actions) {
        actions['linux'] = {
            button: await kernel.translateBlock({ text: '${lang.ge_import_linux}' })
        }
    }
}

module.exports = myplugin

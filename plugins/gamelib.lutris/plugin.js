class myplugin extends global.Plugin {
    constructor(root, manifest) {
        super(root, manifest)
    }
    async init() {
        await super.init()
    }
}

module.exports = myplugin

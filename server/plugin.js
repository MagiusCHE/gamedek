//require(path.join(fullPath,''))
const fs = require('fs')
const path = require('path')
class Plugin {
    static async create(root, manifest) {
        const classname = require(path.join(root, 'plugin.js'))

        const plugin = new classname(root, manifest)
        if (await plugin.checkCapabilities()) {
            await plugin.init()

            return plugin
        }
    }
    #rootPath = undefined
    manifest = undefined
    constructor(root, manifest) {
        this.#rootPath = root
        this.manifest = manifest
        this.#name = this.manifest.simpleName || path.basename(root)
    }
    pluginPath(relpath) {
        return path.resolve(path.join(this.#rootPath, relpath))
    }
    async checkCapabilities() {
        if (this.manifest.os && this.manifest.os.indexOf(process.platform) == -1) {
            this.log(` - Disabled due to OS incompatibility. Required: [${this.manifest.os.join(', ')}]`)
            return false
        }
        return true
    }
    async onAllPluginsLoaded(plugins) {

    }
    async provides(request) {
        if (!request || request.length == 0) {
            return true
        }
        request = Array.isArray(request) ? request : [request]
        if (!this.manifest.provides) {
            return false
        }
        if (!request[0] || request[0].length == 0) {
            return true;
        }
        const avail = this.manifest.provides.split(',')
        for (const r of request) {
            if (avail.indexOf(r) > -1) {
                return true
            }
        }
        return false
    }
    #name = undefined
    toString() {
        return this.#name
    }
    getName() {
        return this.#name
    }
    async log() {
        return kernel.logRawEx(
            'I',
            this.toString(),
            Array.from(arguments)
        )
    }
    async logError() {
        return kernel.logRawEx(
            'E', //error
            this.toString(),
            Array.from(arguments)
        )
    }
    async init() {
    }

}
global.Plugin = Plugin
module.exports = Plugin

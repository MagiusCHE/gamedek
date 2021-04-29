const fs = require('fs')
const md5 = require('md5')
const mkdirp = require('mkdirp')
const path = require('path')
const fetch = require('node-fetch');

class myplugin extends global.Plugin {
    constructor(root, manifest) {
        super(root, manifest)
    }
    #rootPath
    #cachePath
    #cacheExpire
    async init() {
        await super.init()
        const manifest = this.manifest
        const minutes = manifest.cacheExpire.substr(0, manifest.cacheExpire.length - 1) * 60 * 1000
        switch (manifest.cacheExpire.substr(manifest.cacheExpire.length - 1, 1)) {
            case "m":
                this.#cacheExpire = minutes
                break;
            case "h":
                this.#cacheExpire = minutes * 60
                break;
            case "d":
                this.#cacheExpire = minutes * 60 * 24
                break;
            default:
                throw new Error(`Invalid format at "${manifest.cacheExpire}". Accepted metrics are "m,h,d". Ex: "12h".`)
        }

        this.#rootPath = path.join(kernel.appDataRoot, 'scraper')
        mkdirp.sync(this.#rootPath)
        this.#cachePath = path.join(this.#rootPath, 'cache')
        mkdirp.sync(this.#cachePath)
    }

    async ensureFileByUrl(url, ext, forcepurge) {
        if (!url) {
            return
        }
        let jdown = false
        const fname = path.join(this.#cachePath, md5(url) + (ext || ''))
        if (fs.existsSync(fname) && (forcepurge || (new Date() - fs.statSync(fname).mtime > this.#cacheExpire))) {
            fs.unlinkSync(fname)
        }
        if (!fs.existsSync(fname)) {
            try {
                const res = await fetch(url)
                if (!res.ok) {
                    throw new Error(res.status + ': ' + res.statusText)
                }
                const buff = await res.buffer()
                fs.writeFileSync(fname, buff)
                jdown = true
            } catch (err) {
                this.logError(`Error while downloading file from "${url}"`, err)
                return
            }
        }

        return {
            toJSON: function() {
                return JSON.parse(fs.readFileSync(fname).toString())
            },
            fname: fname,
            justDownloaded: jdown
        }
    }
}

module.exports = myplugin

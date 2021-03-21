const fs = require('fs')
const path = require('path')
const util = require('util')
const sprintf = require('sprintf-js').vsprintf
class myplugin extends global.Plugin {
    constructor(root, manifest) {
        super(root, manifest)

    }
    #strings = undefined
    async init() {
        await super.init()
        this.#strings = JSON.parse(fs.readFileSync(this.pluginPath('strings.json')).toString())
    }
    async translateBlock(str) {
        if (typeof str != "string") {
            throw new Error('translateBlock accepts only strings. Passed: ' + util.inspect(str))
        }
        str = str.matchAll(/\${lang\..*}/gm, match => {
            let firstblockidx = match.indexOf(' ')
            if (firstblockidx < 0) {
                firstblockidx = match.indexOf('}')
            }
            const langid = match.substring(7, firstblockidx)
            const rest = match.substring(firstblockidx + 1, match.length - 1)
            const totargs = []
            if (rest != '') {
                const rawargs = rest.split(' ')
                let quotedopened = false
                rawargs.forEach(a => {
                    if (totargs.length > 0 || !quotedopened) {
                        totargs.push(a)
                        quotedopened = (a.substring(0, 1) == '"')
                    } else {
                        totargs[totargs.length - 1] += ' ' + a
                    }
                    if (a.substr(a.length - 1, 1) == '"' && quotedopened) {
                        quotedopened = false
                    }
                })
            }
            const format = this.#strings[kernel.locale][langid] || this.#strings[this.manifest.fallback][langid]
            if (format === undefined) {
                this.logError("## Missing Langid: " + langid + " ##")
                return "## Missing Langid: " + langid + " ##"
            }
            return sprintf(format, totargs)
        })

        return str
    }
}

module.exports = myplugin

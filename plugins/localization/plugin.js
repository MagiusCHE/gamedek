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
        const totstrings = JSON.parse(fs.readFileSync(this.pluginPath('strings.json')).toString())

        for (const plugin_name in kernel.clientOptions.plugins) {
            const plugin = kernel.clientOptions.plugins[plugin_name]
            if (plugin && plugin !== true) {
                const localstrings = plugin.pluginPath('locale.json')

                let loaded = 0
                if (fs.existsSync(localstrings)) {

                    const strings = JSON.parse(fs.readFileSync(localstrings).toString())
                    for (const loc in strings) {
                        for (const newstr in strings[loc]) {
                            totstrings[loc][newstr] = strings[loc][newstr]
                            loaded++
                        }
                    }
                    if (loaded > 0) {
                        this.log('Loaded %o locale strings for %o.', loaded, plugin_name)
                    }

                }
            }
        }
        this.#strings = totstrings
    }
    async translateBlock(_args) {
        let str = _args.text
        if (typeof str != "string") {
            throw new Error('translateBlock accepts only strings. Passed: ' + util.inspect(str))
        }
        //const reg = new RegExp(/\${lang\..*?}/gm)
        //if (reg.test(str)) {
        str = str.matchAll(/\${lang\..*?}/gm, match => {
            let firstblockidx = match.indexOf(' ')
            if (firstblockidx < 0) {
                firstblockidx = match.indexOf('}')
            }
            const langid = match.substring(7, firstblockidx)
            const rest = firstblockidx + 1 < match.length - 1 ? match.substring(firstblockidx + 1, match.length - 1) : ''
            const totargs = []
            if (rest != '') {
                const rawargs = rest.split(' ')
                let quotedopened = false
                rawargs.forEach(a => {
                    if (!quotedopened) {
                        quotedopened = (a.substring(0, 1) == '"')
                        totargs.push(quotedopened ? a.substr(1) : a)                        
                    } else {
                        totargs[totargs.length - 1] += ' ' + a
                    }
                    if (a.substr(a.length - 1, 1) == '"' && quotedopened) {
                        quotedopened = false
                        totargs[totargs.length - 1] = totargs[totargs.length - 1].substr(0, totargs[totargs.length - 1].length-1)
                    }
                })
            }
            const format = this.#strings[kernel.locale][langid] || this.#strings[this.manifest.fallback][langid]
            if (format === undefined) {
                this.logError("## Missing Langid: " + langid + " ##")
                return "## Missing Langid: " + langid + " ##"
            }
            if (totargs.length > 0) {
                return sprintf(format, totargs)
            } else {
                return format
            }
        })
        //}

        _args.text = str
        return str
    }
}

module.exports = myplugin

const mainWindow = require('@electron/remote');
const fs = require('fs')
const path = require('path')
const { ipcRenderer } = require('electron')

const allfu = ipcRenderer.sendSync('kernelFuncs', 'init')

window.kernel = {}

for (const fun of allfu.split(' ')) {
    window.kernel[fun] = async function(...args) {
        try {
            const ret = JSON.parse(await ipcRenderer.invoke('kernel.' + fun, JSON.stringify(args)))

            if (ret.err) {
                throw ret.err
            }

            return ret.return
        } catch (err) {
            throw new Error(`Error while executing "Kernel.${fun}": ${err.stack}`)
        }
    }
}

ipcRenderer.on('kernelEvent', (event, message) => {
    //console.log('preload: Received kernelEvent', message, window.core ? true : false)
    if (window.core) {
        const args = JSON.parse(message)
        core.onKernelEvent(args.type, args.args)
    }
})

document.addEventListener('DOMContentLoaded', () => {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    //console.log(`DOMContentLoaded: core %s`, path.resolve('scripts/core.js'))
    process.chdir(path.resolve('resources/app'))
    ga.src = 'scripts/core.js?v=' + fs.statSync('scripts/core.js').mtime.getTime()
    var s = document.getElementById('preloader');
    s.appendChild(ga);
})

if (!('toJSON' in Error.prototype)) {
    Object.defineProperty(Error.prototype, 'toJSON', {
        value: function() {
            var alt = {};

            Object.getOwnPropertyNames(this).forEach(function(key) {
                alt[key] = this[key];
            }, this);

            return alt;
        },
        configurable: true,
        writable: true
    });
}
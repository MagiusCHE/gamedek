const { app, dialog, ipcMain } = require('electron')
const util = require('util');
const mkdirp = require('mkdirp');
const path = require('path')
const getPath = require('platform-folders').default
const pjson = require('../package.json');

const appDataRoot = path.join(getPath('appData'), pjson.productName)
const fs = require('fs')
const appStartedAt = new Date()
let err_log, std_log, cmb_log, startupConfig
const activeDebugs = {}

const $this = {
    init: () => {
        try {
            $this.initializing = true
            $this.production = process.env.NODE_ENV = 'production'

            ipcMain.on('kernelFuncs', (event, arg) => {
                event.returnValue = Object.keys($this).join(' ')
            })

            for (const fun of Object.keys($this)) {
                if (typeof $this[fun] === 'function') {
                    ipcMain.handle('kernel.' + fun, async (event, marg) => {
                        const args = {}
                        const arg = JSON.parse(marg)
                        let c = 0
                        for (const name of getParamNames($this[fun])) {
                            args[name] = arg[c]
                            c++
                        }
                        try {
                            let ret = await $this[fun](args)
                            return JSON.stringify({
                                "return": ret
                            })
                        } catch (err) {
                            return JSON.stringify({
                                "err": err
                            })
                        }
                    })
                }
            }

            startupConfig = require('../startupConfig')
            if (global.production) {
                $this.appDataRoot = path.join(getPath('appData'), pjson.productName)
                const appConfigFile = $this.appDataRoot + '/startupConfig.json'
                if (!fs.existsSync(appConfigFile)) {
                    fs.writeFileSync(appConfigFile, JSON.stringify(startupConfig, undefined, 2))
                } else {
                    startupConfig = JSON.parse(fs.readFileSync(appConfigFile).toString())
                }
            } else {
                $this.appDataRoot = path.resolve('./appData')
                startupConfig = require('../startupConfig')
                if (!fs.existsSync($this.appDataRoot)) {
                    mkdirp.sync($this.appDataRoot)
                }
            }

            const themepath = path.join(appDataRoot, 'themes')
            if (!fs.existsSync(themepath)) {
                mkdirp.sync(themepath)
            }

            const logpath = path.join($this.appDataRoot, 'logs')
            err_log = path.join(logpath, 'err.log')
            std_log = path.join(logpath, 'std.log')
            cmb_log = path.join(logpath, 'cmb.log')
            if (!fs.existsSync(logpath)) {
                mkdirp.sync(logpath)
            }
            //do not append previous session
            if (fs.existsSync(std_log)) {
                fs.unlinkSync(std_log)
            }
            if (fs.existsSync(err_log)) {
                fs.unlinkSync(err_log)
            }
            if (fs.existsSync(cmb_log)) {
                fs.unlinkSync(cmb_log)
            }

            for (const e of [{
                c: 'log'
                , f: std_log
            }, {
                c: 'error'
                , f: err_log
            }, {
                c: 'warn'
                , f: std_log
            }]) {

                let oriconsole = global.console[e.c].bind(console)
                global.console[e.c] = function(...args) {
                    oriconsole(...args)
                    let chunk = util.format(...args).replace(
                        // eslint-disable-next-line no-control-regex
                        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
                    if (chunk.substr(0, 2) != '  ') {
                        //mainlog system

                        chunk = '   Main:: ' + chunk.trim()
                    }
                    fs.appendFileSync(e.f, msToTime((new Date() - appStartedAt)) + ' ' + chunk.trim() + '\n')
                    fs.appendFileSync(cmb_log, msToTime((new Date() - appStartedAt)) + ' ' + chunk.trim() + '\n')
                }
            }

            log('Log system started at %s on %s:', new Date().toISOString(), std_log)

            logError('Log error system started at %s on %s:', new Date().toISOString(), err_log)

        } catch (err) {
            try {
                if (!err_log) {
                    let errpath
                    if (!global.production) {
                        $this.appDataRoot = path.resolve('./appData')
                        errpath = path.join($this.appDataRoot, 'logs')
                    } else {
                        const exenameA = path.basename(process.argv[0]).split('.')
                        exenameA.pop()
                        const exename = exenameA.join('.')

                        const pname = (pjson && pjson.productName) ? pjson.productName : exename
                        errpath = path.join(getPath('appData'), pname, 'logs')
                    }

                    if (!fs.existsSync(errpath)) {
                        mkdirp.sync(errpath)
                    }
                    err_log = path.join(errpath, 'err.log')
                }
                fs.appendFileSync(err_log, new Date().toISOString() + ' INIT ERROR: ' + err.stack + '\n')
                dialog.showMessageBoxSync({
                    type: 'error',
                    title: 'Unexpected init error.',
                    message: 'Send the file listed below to support in order to resolve the iussue:\n' + err_log
                })
            } finally {
                $this.initError = true
            }
        } finally {
            $this.initializing = false
        }


    },
    themeFullPath: undefined,
    getThemeUrl: async function({ relativePath }) {
        return 'file://' + path.join($this.themeFullPath, relativePath)
    },
    clientOptions: undefined,
    applicationStart: async function({ options }) {
        $this.clientOptions = {
            ...options, ...JSON.parse(JSON.stringify(startupConfig))
        }
        $this.clientOptions.production = $this.production
        $this.clientOptions.windowTitle = pjson.productTitle

        $this.clientOptions.theme = $this.clientOptions.theme || 'default';

        $this.themeFullPath = path.resolve(path.join($this.appDataRoot, 'themes', $this.clientOptions.theme))
        if (!fs.existsSync($this.themeFullPath)) {
            $this.themeFullPath = path.resolve(path.join('.', 'themes', $this.clientOptions.theme))
        }

        return $this.clientOptions
    },
    applicationExit: async () => {
        $this.mainWindow.close();
    },
    showWindow: async () => {
        $this.mainWindow.show()
        if (!global.production) {
            $this.mainWindow.webContents.openDevTools()
        }
    },
    loadData: async ({ name }) => {
        const savepath = path.join(appDataRoot, 'save')
        const dest = path.join(savepath, name + '.json')
        if (!fs.existsSync(dest)) {
            return undefined
        }
        return fs.readFileSync(dest).toString()
    },
    storeData: async ({ name, value }) => {
        const savepath = path.join(appDataRoot, 'save')
        const dest = path.join(savepath, name + '.json')
        if (!fs.existsSync(savepath)) {
            mkdirp.sync(savepath)
        }
        return fs.writeFileSync(dest, value)
    },
    criticalError: async function({ err }) {
        logError('Critical error is invoked:', err.stack)
        logError('App will be closed.')
        dialog.showMessageBoxSync({
            type: 'error',
            title: 'Unexpected critical error.',
            message: 'Send the file listed below to support in order to resolve the iussue:\n' + err_log
        })
        app.quit();
    },
    logRawEx: async function({ level, sender, args }) {
        if (args == undefined || args.length == 0) {
            return;
        }
        let head = ''
        switch (level) {
            case 'E':
                head = '[ERROR] '
                break;
            case 'W':
                head = '[WARN] '
                break
        }
        /*if (typeof args[0] == 'object') {
            args.unshift(head + '%s')
        } else {
            args[0] = head + args[0]
        }*/

        let firstisobject = false
        args.forEach((a, i) => {
            if (typeof a == 'object') {
                if (i == 0) {
                    firstisobject = true
                }
                args[i] = util.inspect(a, true, 2, true)
            }
        })

        if (firstisobject) {
            args.unshift('%s')
        }

        const key = 'l_' + level + '_' + sender
        if (!activeDebugs[key]) {
            activeDebugs[key] = {
                //file: require('debug')(sender),
                console: require('debug')(head + util.format(startupConfig.log.namespaceFormat, sender))
            }
            activeDebugs[key].console.useColors = true
            activeDebugs[key].console.enabled = true // activeDebugs[key].file.enabled = true

            if (level == 'I') {
                activeDebugs[key].console.log = console.log.bind(console)
            } else if (level == 'E') {
                activeDebugs[key].console.log = console.error.bind(console)
            } else if (level == 'W') {
                activeDebugs[key].console.log = console.warn.bind(console)
            }
        }

        activeDebugs[key].console.apply(activeDebugs[key].console, args)
    },
}

const log = async function() {
    return $this.logRawEx({
        level: 'I',
        sender: 'Kernel',
        args: Array.from(arguments)
    })
}
const logError = async function() {
    return $this.logRawEx({
        level: 'E', //error
        sender: 'Kernel',
        args: Array.from(arguments)
    })
}

module.exports = $this

function msToTime(duration) {
    var milliseconds = parseInt((duration % 1000)),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    if (milliseconds == 1000) {
        milliseconds = 0
    }

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds + "." + ('' + milliseconds).padStart(3, '0');
}


var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/)|[{}])/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func) {
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null)
        result = [];
    return result;
}

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
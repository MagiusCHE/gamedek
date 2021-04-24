const childProcess = require("child_process");
const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3')
const sqlite = require('sqlite')
const yaml = require('yaml')

class myplugin extends global.Plugin {
    constructor(root, manifest) {
        super(root, manifest)
    }
    #lutrisBin
    #lutrisDbPath
    #lutrisGamesCFGPath
    #lutrisIconsPath
    #pkillBin
    async init() {
        await super.init()
    }
    async checkCapabilities() {
        if (!(await super.checkCapabilities())) {
            return false;
        }
        const pwhich = async (bin) => {
            let exe
            if (process.platform == 'linux') {
                const ret = childProcess.spawnSync('which', [bin], { shell: true }) //which
                exe = ret.stdout.toString().trim()
            } else if (process.platform == 'win32') {
                throw new Error(' - TODO')
            }
            return (exe && fs.existsSync(exe) && fs.statSync(exe).isFile()) ? exe : false
        }
        //verify if lutris existsù
        this.#lutrisBin = await pwhich('lutris')
        if (!this.#lutrisBin) {
            this.logError(` - Lutris is not installed. Binary cannot be found.`)
            return false
        }
        if (process.platform == 'linux') {
            this.#lutrisDbPath = path.join(kernel.getPath('home'), '.local/share/lutris/pga.db')
            if (!fs.existsSync(this.#lutrisDbPath)) {
                logError(` - Cannot find database in "${this.#lutrisDbPath}"`)
                return false
            }
            this.#lutrisGamesCFGPath = path.join(kernel.getPath('home'), '.config/lutris/games')
            if (!fs.existsSync(this.#lutrisGamesCFGPath)) {
                logError(` - Cannot find games dir in "${this.#lutrisGamesCFGPath}"`)
                return false
            }
            this.#lutrisIconsPath = path.join(kernel.getPath('home'), '.local/share/icons/hicolor/128x128/apps')
            if (!fs.existsSync(this.#lutrisIconsPath)) {
                logError(` - Cannot find icons dir in "${this.#lutrisIconsPath}"`)
            }
        } else if (process.platform == 'win32') {
            throw new Error(' - TODO')
        }


        this.#pkillBin = await pwhich('pkill')
        //verify if pkill exists
        if (!this.#pkillBin) {
            this.logError(` - Missing pkill binary used to kill lutris after game exit.`)
            return false
        }

        this.log(` - Lutris binary: %o`, this.#lutrisBin)
        this.log(` - pkill binary: %o`, this.#pkillBin)
        return true
    }
    async getImportAction(actions) {
        if (!actions['gameengine']) {
            actions['gameengine'] = {}
        }
        actions['gameengine']['import.lutris'] = {
            button: await kernel.translateBlock('${lang.ge_import_lutris}'),
            short: await kernel.translateBlock('${lang.ge_import_lutris_short}'),
            args: false
        }
    }
    async onButtonClick(action) {
        if (action != 'import.lutris') {
            return
        }
        kernel.sendEvent('showProgress', await kernel.translateBlock('${lang.ge_import_lutris_progress}'))

        const ret = childProcess.spawnSync(this.#lutrisBin, ['-l', '--installed', '-j'], { shell: true }) //which
        const list = JSON.parse(ret.stdout.toString().trim())
        this.log(list)

        const db = await sqlite.open({
            filename: this.#lutrisDbPath,
            driver: sqlite3.Database
        })

        const results = await db.all('SELECT * FROM games WHERE installed = 1')

        this.log(results)
        //create entries or update existing
        const games = await kernel.gameList_getGamesByProvider('import.lutris')

        for (const game of list) {

            const res = results.find(g => g.id == game.id)

            if (!res) {
                continue
            }
            const yaml_path = path.join(this.#lutrisGamesCFGPath, res.configpath + '.yml')
            if (!fs.existsSync(yaml_path)) {
                this.logError(` - Skipped "${res.name}" due to missing yaml config at "${yaml_path}".`)
                continue
            }

            const cfg = yaml.parse(fs.readFileSync(yaml_path).toString())

            const banner_path = path.resolve(path.join(this.#lutrisDbPath, '../banners', res.slug + '.jpg'))
            const banner = res.has_custom_banner || (fs.existsSync(banner_path) ? banner_path : undefined)
            ///home/magius/.local/share/icons/hicolor/128x128/apps/
            const icon_path = path.resolve(path.join(this.#lutrisIconsPath, 'lutris_' + res.slug + '.png'))
            const icon = res.has_custom_icon || (fs.existsSync(icon_path) ? icon_path : undefined)

            const newone = games.find(g => g.props.lutris.id == game.id) || {
                props: {
                    info: {},
                    lutris: {
                        id: game.id,
                        platform: res.platform,
                        runner: res.runner
                    }
                },
                provider: "import.lutris"
            }
            const exists = newone.hash ? true : false
            if (exists) {
                newone.prev_hash = newone.hash
            }
            newone.props.info.title = game.name
            newone.props.info.imagelandscape = banner
            newone.props.info.icon = icon
            newone.props.info.year = '' + res.year

            let response = await kernel.broadcastPluginMethod('gameengine', `confirmGameParams`, newone, {})
            let ret = response.returns.last

            if (!ret.error) {
                ret = (await kernel.broadcastPluginMethod('gameengine', exists ? `updateGame` : `createNewGame`, response.args[0])).returns.last
                if (!ret.error) {
                    if (!cfg.system) {
                        cfg.system = {}
                    }
                    if (process.platform == 'linux') {
                        cfg.system.postexit_command = this.#pkillBin + ' lutris'
                        fs.writeFileSync(yaml_path, yaml.stringify(cfg))
                    }
                }
            }
        }
        kernel.sendEvent('hideProgress')
    }
    async updateGame(info, returns) {
        returns = returns || {}
        if (info.provider != 'import.lutris') {
            return returns
        }
        if (returns.handled) {
            return returns
        }
        await kernel.gameList_updateGame(info)

        returns.handled = true

        return returns
    }
    async createNewGame(info, returns) {
        returns = returns || {}
        if (info.provider != 'import.lutris') {
            return returns
        }
        if (returns.handled) {
            return returns
        }

        await kernel.gameList_addNewGame(info)

        returns.handled = true

        return returns
    }
}

module.exports = myplugin

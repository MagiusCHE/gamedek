const childProcess = require("child_process");
const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3')
const sqlite = require('sqlite')
const yaml = require('yaml');

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
        actions['import.lutris'] = {
            provider: 'gameengine',
            button: await kernel.translateBlock('${lang.ge_import_lutris}'),
            short: await kernel.translateBlock('${lang.ge_import_lutris_short}'),
            immediate: true
        }
        return actions
    }
    async queryInfoForGame(action, newargsinfo) {
        if (!newargsinfo) {
            newargsinfo = {}
        }
        if (!newargsinfo.tabs) {
            newargsinfo.tabs = {}
        }
        
        if (action != 'import.lutris') {
            return newargsinfo
        }
        
        newargsinfo.tabs.lutris = {
            order: "1"
            , title: await kernel.translateBlock('${lang.ge_lutris_tablu}')
            , items: {
                engine: {
                    type: "readonly"
                    , label: await kernel.translateBlock('${lang.ge_lutris_engine}')
                    , default: 'Lutris'
                },
                id: {
                    type: "readonly"
                    , label: await kernel.translateBlock('${lang.ge_lutris_id}')
                },
                platform: {
                    type: "readonly"
                    , label: await kernel.translateBlock('${lang.ge_lutris_platform}')
                },
                runner: {
                    type: "readonly"
                    , label: await kernel.translateBlock('${lang.ge_lutris_runner}')
                }
            }
        }
        return newargsinfo;
    }
    async onButtonClick(button) {
        if (button.id != 'import.lutris') {
            return
        }
        kernel.sendEvent('showProgress', await kernel.translateBlock('${lang.ge_import_lutris_progress}'))

        kernel.sendEvent('allowHideProgress', false)
        let added = 0, updated = 0, skipped = 0

        try {
            const ret = childProcess.spawnSync(this.#lutrisBin, ['-l', '--installed', '-j'], { shell: true }) //which
            const list = JSON.parse(ret.stdout.toString().trim())
            this.log(list)

            const db = await sqlite.open({
                filename: this.#lutrisDbPath,
                driver: sqlite3.Database
            })

            const results = await db.all('SELECT * FROM games WHERE installed = 1 and runner not like \'steam\'')

            this.log(results)
            //create entries or update existing
            const games = await kernel.gameList_getGamesByProvider('import.lutris')

            for (const game of list) {

                const res = results.find(g => g.id == game.id)

                if (!res) {
                    this.logError(` - Skipped "${game.name}" due to missing sql entry`, ret.message)
                    continue
                }
                const yaml_path = path.join(this.#lutrisGamesCFGPath, res.configpath + '.yml')
                if (!fs.existsSync(yaml_path)) {
                    this.logError(` - Skipped "${game.name}" due to missing yaml config at "${yaml_path}".`)
                    skipped++
                    continue
                }

                const cfg = yaml.parse(fs.readFileSync(yaml_path).toString())

                const banner_path = path.resolve(path.join(this.#lutrisDbPath, '../banners', res.slug + '.jpg'))
                let banner = res.has_custom_banner || (fs.existsSync(banner_path) ? banner_path : undefined)
                ///home/magius/.local/share/icons/hicolor/128x128/apps/
                const icon_path = path.resolve(path.join(this.#lutrisIconsPath, 'lutris_' + res.slug + '.png'))
                let icon = res.has_custom_icon || (fs.existsSync(icon_path) ? icon_path : undefined)

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

                if (exists) {

                    //verify 
                    if (newone.props.info.imagelandscape) {
                        const rpath = (await kernel.broadcastPluginMethod(undefined, 'getPathbyGameHash', newone.hash, { path: newone.props.info.imagelandscape })).returns.last.path

                        if (rpath && fs.statSync(rpath).mtime > fs.statSync(banner).mtime) {
                            banner = newone.props.info.imagelandscape
                        }
                    }
                    if (newone.props.info.icon) {
                        const rpath = (await kernel.broadcastPluginMethod(undefined, 'getPathbyGameHash', newone.hash, { path: newone.props.info.icon })).returns.last.path

                        if (rpath && fs.statSync(rpath).mtime > fs.statSync(icon).mtime) {
                            icon = newone.props.info.icon
                        }
                    }
                }

                newone.props.info.imagelandscape = banner
                newone.props.info.icon = icon
                newone.props.info.year = res.year || new Date().getFullYear()

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
                        if (exists) {
                            updated++
                        } else {
                            added++
                        }
                    } else {
                        this.logError(` - Skipped "${game.name}"`, ret)
                        skipped++
                    }
                } else {
                    this.logError(` - Skipped "${game.name}"`, ret)
                    skipped++
                }
            }
        } finally {
            kernel.sendEvent('allowHideProgress', true)
        }
        kernel.sendEvent('hideProgress')
        this.#lastImportResults = {
            added: added,
            skipped: skipped,
            updated: updated
        }
        kernel.sendEvent('methodExecuted', {
            plugin: this.getName(),
            action: button.id,
            provider: 'gameengine',
            method: 'onButtonClick'
        })
        kernel.sendEvent('showMessage', {
            title: await kernel.translateBlock('${lang.ge_import_lutris_report_title}')
            , ishtml: true
            , body: await kernel.translateBlock('${lang.ge_import_lutris_report ' + `${added} ${updated} ${skipped}` + '}')
        })
    }
    #lastImportResults
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
    #activegames = {}
    async binExecutonTerminated(pid) {
        let hash
        for (const thash in this.#activegames) {
            if (this.#activegames[thash] == pid) {
                hash = thash
                break
            }
        }
        if (!hash) {
            return
        }

        const ret = (await kernel.broadcastPluginMethod('fileservice', 'getReturnsBinByPid', pid, true)).returns.last
        if (!ret) {
            return
        }
        await kernel.gameList.setGameStoppedByHash(hash, {
            error: ret?.returns?.exit?.error,
            std: ret?.returns?.exit?.log,
            stderr: ret?.returns?.exit?.err
        })
    }
    async forceCloseGameByHash(hash) {
        const games = await kernel.gameList.getGames()
        const game = games.find(g => g.hash == hash)
        if (!game || game.provider != 'import.lutris') {
            return
        }

        return kernel.broadcastPluginMethod('fileservice', 'forceCloseBinByPid', this.#activegames[hash], 'SIGHUP')
    }
    async startGameByHash(hash, returns) {
        returns = returns || {}
        if (returns.handled) {
            return returns
        }
        const games = await kernel.gameList.getGames()
        const game = games.find(g => g.hash == hash)
        if (!game) {
            returns.error = {
                title: await kernel.translateBlock('${lang.ge_com_info_filenotfound_title}'),
                message: await kernel.translateBlock('${lang.ge_com_info_filenotfound "' + 'hash' + '" "' + hash + '"}'),
            }
            return returns
        }

        if (game.provider != 'import.lutris') {
            return returns
        }

        const args = {
            executable: this.#lutrisBin,
            detached: true,
            arguments: 'lutris:rungameid/' + game.props.lutris.id
        }
        const ret = (await kernel.broadcastPluginMethod('fileservice', 'spawnBinOrScript', args)).returns.last

        if (ret.error) {
            await kernel.gameList.setGameStoppedByHash(hash, {
                error: ret.error,
                std: log.join('\n'),
                stderr: err.join('\n')
            })
        } else {
            this.#activegames[hash] = ret.pid
            await kernel.gameList.setGameStartedByHash(hash)
        }

        return returns
    }
}

module.exports = myplugin

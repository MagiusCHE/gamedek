const childProcess = require("child_process");
const fs = require('fs')
const path = require('path')
const vdf = require('node-vdf')

class myplugin extends global.Plugin {
    constructor(root, manifest) {
        super(root, manifest)
    }
    #steamBin
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
        this.#steamBin = await pwhich('steam')
        if (!this.#steamBin) {
            this.logError(` - Steam is not installed. Binary cannot be found.`)
            return false
        }
        if (process.platform == 'linux') {

        } else if (process.platform == 'win32') {
            //throw new Error(' - TODO')
        }

        this.log(` - Steam binary: %o`, this.#steamBin)
        return true
    }
    async getImportAction(actions) {
        actions['import.steam'] = {
            provider: 'gameengine',
            button: await kernel.translateBlock('${lang.ge_import_steam}'),
            short: await kernel.translateBlock('${lang.ge_import_steam_short}'),
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

        if (action != 'import.steam') {
            return newargsinfo
        }

        newargsinfo.tabs.steam = {
            order: "1"
            , title: await kernel.translateBlock('${lang.ge_steam_tabst}')
            , items: {
                engine: {
                    type: "readonly"
                    , label: await kernel.translateBlock('${lang.ge_steam_engine}')
                    , default: 'Stream'
                },
                appid: {
                    type: "readonly"
                    , label: await kernel.translateBlock('${lang.ge_steam_id}')
                }
            }
        }
        return newargsinfo;
    }
    async onButtonClick(button) {
        if (button.id != 'import.steam') {
            return
        }
        kernel.sendEvent('showProgress', await kernel.translateBlock('${lang.ge_import_steam_progress}'))

        kernel.sendEvent('allowHideProgress', false)
        let added = 0, updated = 0, skipped = 0
        let softerror
        try {

            //open /home/<user>/.steam/steam/steamapps/libraryfolders.vdf

            const libraryfolders_path = path.join(kernel.getPath('home'), '.steam/steam/steamapps/libraryfolders.vdf')
            if (!fs.existsSync(libraryfolders_path)) {
                softerror = true
                throw new Error(`Missing %o`, libraryfolders_path)
            }

            const libraryfolders = vdf.parse(fs.readFileSync(libraryfolders_path).toString())

            //enumerate folders

            const appids = {}

            for (const idx in libraryfolders.LibraryFolders) {
                if (isNaN(idx)) {
                    continue
                }
                const folder = path.join(libraryfolders.LibraryFolders[idx], 'steamapps')
                if (fs.existsSync(folder) && fs.statSync(folder).isDirectory()) {
                    for (const d of fs.readdirSync(folder)) {
                        if (path.extname(d).toLowerCase() != '.acf') {
                            continue
                        }
                        const info = vdf.parse(fs.readFileSync(path.join(folder, d)).toString())
                        const aiurl = this.manifest.steam.detailsUrl.replace(/\<appids\>/gm, info.AppState.appid)
                        const rs = await kernel.broadcastPluginMethod('curl', 'ensureFileByUrl', aiurl, '.json')
                        const winfos = rs.returns.last.toJSON()
                        if (winfos[info.AppState.appid].success) {
                            appids[info.AppState.appid] = {
                                acf: info,
                                winfo: winfos[info.AppState.appid].data
                            }
                        }
                    }
                }
            }

            //import all appid
            const games = await kernel.gameList_getGamesByProvider('import.steam')
            for (const appid in appids) {
                const info = appids[appid]
                const newone = games.find(g => g.props.steam.appid == appid) || {
                    props: {
                        info: {},
                        steam: {
                            appid: appid
                        }
                    },
                    provider: "import.steam"
                }
                newone.props.info.title = info.acf.AppState.name
                for (const dp of (info.winfo.release_date.date || '').split(' ')) {
                    if (dp.length == 4 && !isNaN(dp)) {
                        newone.props.info.year = parseInt(dp, 10)
                    }
                }

                const exists = newone.hash ? true : false
                if (exists) {
                    newone.prev_hash = newone.hash
                }

                if (!newone.props.info.year) {
                    newone.props.info.year = new Date().getFullYear()
                }

                const imgs = {
                    imagelandscape: null,
                    imageportrait: null,
                    /*icon: null*/
                }

                for (const img in imgs) {
                    const fname = (await this.ensureDownloadedImage(this.manifest.steam[`${img}Url`], appid))?.fname
                    imgs[img] = fname
                    if (exists) {
                        //verify 
                        if (newone.props.info[img]) {
                            const rpath = (await kernel.broadcastPluginMethod(undefined, 'getPathbyGameHash', newone.hash, { path: newone.props.info[img] })).returns.last.path

                            if (rpath && fs.statSync(rpath).mtime > fs.statSync(imgs[img]).mtime) {
                                imgs[img] = newone.props.info[img]
                            }
                        }
                    }
                    newone.props.info[img] = imgs[img]
                }
                let response = await kernel.broadcastPluginMethod('gameengine', `confirmGameParams`, newone, {})
                let ret = response.returns.last

                if (!ret.error) {
                    ret = (await kernel.broadcastPluginMethod('gameengine', exists ? `updateGame` : `createNewGame`, response.args[0])).returns.last
                    if (!ret.error) {
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

        } catch (err) {
            if (!softerror) {
                throw err
            } else {
                this.error(err)
                softerror = err
            }
        } finally {
            kernel.sendEvent('allowHideProgress', true)
            kernel.sendEvent('hideProgress')
        }

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
            title: await kernel.translateBlock('${lang.ge_import_steam_report_title}')
            , ishtml: true
            , body: await kernel.translateBlock('${lang.ge_import_steam_report ' + `${added} ${updated} ${skipped}` + '}' + (softerror ? ('<p>' + softerror + '</p>') : ''))
        })
    }
    async ensureDownloadedImage(url, appid) {
        const murl = url.replace(/<appid>/gm, appid)

        return (await kernel.broadcastPluginMethod('curl', 'ensureFileByUrl', murl, '.jpg')).returns.last
    }

    #lastImportResults
    async updateGame(info, returns) {
        returns = returns || {}
        if (info.provider != 'import.steam') {
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
        if (info.provider != 'import.steam') {
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
            executable: this.#steamBin,
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

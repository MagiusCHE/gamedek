const fs = require('fs')
const md5 = require('md5')
const mkdirp = require('mkdirp')
const path = require('path')
const rimraf = require('rimraf')
const fetch = require('node-fetch');
const util = require('util');

/*
To load full list use: https://api.steampowered.com/ISteamApps/GetAppList/v2/
Large banner: https://cdn.akamai.steamstatic.com/steam/apps/<appid>/header.jpg
Small Banner: https://cdn.akamai.steamstatic.com/steam/apps/<appid>/capsule_184x69.jpg
App details: https://store.steampowered.com/api/appdetails/?appids=1113560,2134234,123123
Background: https://cdn.akamai.steamstatic.com/steam/apps/1113560/page_bg_generated_v6b.jpg
*/

class myplugin extends global.Plugin {
    constructor(root, manifest) {
        super(root, manifest)
    }
    #rootPath
    #cachePath
    #fullListPath
    #fullList
    #fullListExpire
    async init() {
        await super.init()
        const manifest = this.manifest
        switch (manifest.steam.fullListExpire.substr(manifest.steam.fullListExpire.length - 1, 1)) {
            case "m":
                this.#fullListExpire = manifest.steam.fullListExpire.substr(0, manifest.steam.fullListExpire.length - 1) * 60 * 1000
                break;
            case "h":
                this.#fullListExpire = manifest.steam.fullListExpire.substr(0, manifest.steam.fullListExpire.length - 1) * 60 * 60 * 1000
                break;
            case "d":
                this.#fullListExpire = manifest.steam.fullListExpire.substr(0, manifest.steam.fullListExpire.length - 1) * 60 * 60 * 24 * 1000
                break;
            default:
                throw new Error(`Invalid format at "${manifest.steam.fullListExpire}". Accepted metrics are "m,h,d". Ex: "12h".`)
        }

        this.#rootPath = path.join(kernel.appDataRoot, 'sis')
        mkdirp.sync(this.#rootPath)
        this.#cachePath = path.join(this.#rootPath, 'cache')
        mkdirp.sync(this.#cachePath)
        this.#fullListPath = path.join(this.#rootPath, 'fulllist.json')
        if (fs.existsSync(this.#fullListPath) && (new Date() - fs.statSync(this.#fullListPath).mtime) > this.#fullListExpire) {
            this.log(` - Fulllist is expired. Delete it. "${this.#fullListPath}"`)
            fs.unlinkSync(this.#fullListPath)
        }
    }
    async libraryLoaded(library) {
        library.games.forEach(g => {
            g.props.scrape = g.props.scrape || {}
            if (g.props.scrape.sis === undefined) {
                g.props.scrape.sis = false
            }
        })
    }
    async updateGame(info, returns) {
        return this.createNewGame(info, returns)
    }
    async createNewGame(info, returns) {
        returns = returns || {}

        if (info.provider == 'import.steam') {//issteam
            return
        }

        info.props.scrape = info.props.scrape || {}
        if (info.props.scrape.sis == "on" || info.props.scrape.sis === true) {
            await this.scrapeGameInfo(info)
        } else {
            info.props.scrape.sis = false
        }

        return returns
    }
    async ensureDatabase() {
        return new Promise(async (resolve) => {


            if (!this.#fullList && fs.existsSync(this.#fullListPath)) {
                this.#fullList = JSON.parse(fs.readFileSync(this.#fullListPath).toString())
                if (Object.keys(this.#fullList).length == 0) {
                    this.#fullList = undefined
                }
            }
            if (!fs.existsSync(this.#fullListPath) || !this.#fullList) {
                try {
                    const res = await fetch(this.manifest.steam.fullListUrl)
                    if (!res.ok) {
                        throw new Error(res.status + ': ' + res.statusText)
                    }
                    this.#fullList = await res.json()
                    fs.writeFileSync(this.#fullListPath, JSON.stringify(this.#fullList))
                } catch (err) {
                    this.logError(`Error while downloading list from "${this.manifest.steam.fullListUrl}"`, err)
                    this.#fullList = {}
                }
            }


            resolve()
        })
    }
    async scrapeGameInfo(game) {
        game.props.scrape.sis = true
        kernel.sendEvent('showProgress', await kernel.translateBlock('${lang.ge_sis_scrape_inprogress}'))
        if (!game.props.scrape.steamid) {
            //{"applist":{"apps"
            await this.ensureDatabase()
            if (this.#fullList) {
                const entry = this.#fullList.applist.apps.find(g => g.name.toLowerCase() == game.props.info.title.toLowerCase())
                if (!entry) {
                    this.logError(`Game with name "${game.props.info.title}" cannot be found on steam.`)
                    game.props.scrape.error = util.format((await kernel.translateBlock('${lang.ge_sis_scrape_steamidnotfound}')), game.props.info.title)
                } else {
                    game.props.scrape.steamid = entry.appid
                    delete game.props.scrape.error
                }
            }
        }

        if (game.props.scrape.steamid) {
            let header_path = path.join(this.#cachePath, game.props.scrape.steamid + '_header.jpg')
            if (!fs.existsSync(header_path)) {
                const header_url = this.manifest.steam.landscapeUrl.replace(/<appid>/gm, game.props.scrape.steamid)
                try {
                    const res = await fetch(header_url)
                    if (!res.ok) {
                        throw new Error(res.status + ': ' + res.statusText)
                    }
                    const header = await res.buffer()
                    fs.writeFileSync(header_path, header)
                } catch (err) {
                    this.logError(`Error while downloading header image from "${header_url}"`, err)
                    header_path = game.props.info.imagelandscape
                }
            }
            game.props.info.imagelandscape = header_path
        }

        game.props.scrape.scraped = new Date()
        kernel.sendEvent('hideProgress')
    }
    async onButtonClick(button, args) {
        if (button.id != 'sis-single') {
            return
        }
        const game = await kernel.gamelist_getGameByHash(args)
        game.props.scrape.sis = true

        const ret = (await kernel.broadcastPluginMethod('gameengine', `updateGame`, game)).returns.last
        if (ret.error) {
            kernel.sendEvent('showMessage', {
                title: ret.error.title,
                body: ret.error.message
            })
        } else if (game.props.scrape.error) {
            kernel.sendEvent('showMessage', {
                title: game.props.info.title,
                body: game.props.scrape.error
            })
        } else {
            kernel.sendEvent('gameUpdated', { hash: game.hash, oldhash: args })
        }
    }
    async queryButtonforGameDetails(hash, buttons) {
        const game = await kernel.gamelist_getGameByHash(hash)
        if (game.provider == 'import.steam') {//issteam
            return
        }
        buttons = buttons || {}
        buttons["sis-single"] = {
            plugin: this.getName(),
            icon: 'mi:image_search',
            title: await kernel.translateBlock('${lang.ge_sis_scrape_singlegame}')
        }

        return buttons
    }
    async queryInfoForNewGame(action, newargsinfo) {
        if (!newargsinfo) {
            newargsinfo = {}
        }
        if (!newargsinfo.tabs) {
            newargsinfo.tabs = {}
        }
        newargsinfo.tabs.scrape = newargsinfo.tabs.scrape || {}
        newargsinfo.tabs.scrape.order = "2"
        newargsinfo.tabs.scrape.title = await kernel.translateBlock('${lang.ge_sis_scrape_tab}')
        newargsinfo.tabs.scrape.items = newargsinfo.tabs.scrape.items || {}
        newargsinfo.tabs.scrape.items.sis = {
            type: "activable"
            , label: await kernel.translateBlock('${lang.ge_sis_scrape_enable}')
            , activable_text: await kernel.translateBlock('${lang.ge_sis_scrape_enable_text}')
            , note: await kernel.translateBlock('${lang.ge_sis_scrape_enable_tip}')
            , default: true
        }
        return newargsinfo;
    }
}

module.exports = myplugin

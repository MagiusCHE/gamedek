const fs = require('fs')
const md5 = require('md5')
const mkdirp = require('mkdirp')
const path = require('path')
const rimraf = require('rimraf')
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
    #fullList
    async init() {
        await super.init()
    }

    async ensureDatabase() {
        const ret = (await kernel.broadcastPluginMethod('scraper', 'ensureFileByUrl', this.manifest.steam.fullListUrl)).returns.last

        if (ret.justDownloaded || !this.#fullList || Object.keys(this.#fullList).length == 0) {
            this.#fullList = ret.toJSON()
        }
    }
    async forceEnableScrape(game, enable) {
        game.props.scrape.steam = enable
    }
    async updateGameInfoWithoutScraping(info, returns) {
        //sanitize props
        info.props.scrape.steam = (info.props.scrape.steam == "on" || info.props.scrape.steam === true || info.props.scrape.steam === 1) ? true : false

        return returns
    }

    async scrapeGameInfo(game) {
        if (!game.props.scrape.steam) {
            return game
        }
        if (!game.props.scrape.steamid) {
            if (this.#fullList) {
                const entry = this.#fullList.applist.apps.find(g => g.name.toLowerCase() == game.props.info.title.toLowerCase())
                if (!entry) {
                    this.logError(`Game with name "${game.props.info.title}" cannot be found on steam.`)
                    return game
                } else {
                    game.props.scrape.steamid = entry.appid
                }
            }
        }

        if (game.props.scrape.steamid) {
            game.props.info.imagelandscape = (await this.ensureDownloadedImage(this.manifest.steam.landscapeUrl, game.props.scrape.steamid))?.fname || game.props.info.imagelandscape

            game.props.info.imageportrait = (await this.ensureDownloadedImage(this.manifest.steam.portraitUrl, game.props.scrape.steamid))?.fname || game.props.info.imageportrait

            //game.props.info.icon = (await this.ensureDownloadedImage(this.manifest.steam.iconUrl, game.props.scrape.steamid)) || game.props.info.icon
        }
        return game
    }
    async ensureDownloadedImage(url, appid) {
        const header_url = url.replace(/<appid>/gm, appid)

        return (await kernel.broadcastPluginMethod('scraper', 'ensureFileByUrl', header_url, '.jpg')).returns.last
    }
    async queryScrapeInfoForGame(scraperitems) {
        scraperitems.steam = {
            type: "activable"
            , label: await kernel.translateBlock('${lang.sw_enable}')
            , activable_text: await kernel.translateBlock('${lang.sw_enable_text}')
            , note: await kernel.translateBlock('${lang.sw_enable_tip}')
            , default: true
        }
        return scraperitems;
    }
}

module.exports = myplugin

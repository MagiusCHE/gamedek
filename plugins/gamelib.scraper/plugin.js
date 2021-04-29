const fs = require('fs')
const md5 = require('md5')
const mkdirp = require('mkdirp')
const path = require('path')
const fetch = require('node-fetch');

class myplugin extends global.Plugin {
    constructor(root, manifest) {
        super(root, manifest)
    }
    async init() {
        await super.init()        
    }

    async libraryLoaded(library) {
        library.games.forEach(g => {
            g.props.scrape = g.props.scrape || {}
            if (g.props.scrape.enable === undefined) {
                g.props.scrape.enable = false //disable global scraping by default
            }
        })
    }
    async updateGame(info, returns) {
        return this.createNewGame(info, returns)
    }
    async createNewGame(info, returns) {
        returns = returns || {}

        info.props.scrape = info.props.scrape || {}

        info.props.scrape.enable = (info.props.scrape.enable == "on" || info.props.scrape.enable === true || info.props.scrape.enable === 1) ? true : false

        await kernel.broadcastPluginMethod('scraper-worker', `updateGameInfoWithoutScraping`, info, returns)

        if (info.props.scrape.enable) {
            await this.scrapeGameInfo(info)
        }

        return returns
    }
    async ensureDatabase() {
        //call ensure database for every "SCRAPE ENABLED" plugin
        await kernel.broadcastPluginMethod('scraper-worker', `ensureDatabase`)
    }
    async scrapeGameInfo(game) {
        game.props.scrape.enable = true
        kernel.sendEvent('showProgress', await kernel.translateBlock('${lang.ge_scrape_inprogress}'))
        await this.ensureDatabase()

        //call scrapeGameInfo for every "SCRAPE ENABLED" plugin
        game = (await kernel.broadcastPluginMethod('scraper-worker', `scrapeGameInfo`, game)).returns.last

        game.props.scrape.scraped = new Date()
        kernel.sendEvent('hideProgress')
    }

    async queryButtonforGameDetails(hash, buttons) {
        const game = await kernel.gamelist_getGameByHash(hash)
        if (game.props.scrape.scraped === false) {//issteam
            return
        }
        buttons = buttons || {}
        buttons["scrape-game"] = {
            plugin: this.getName(),
            icon: 'mi:travel_explore',
            title: await kernel.translateBlock('${lang.ge_scrape_singlegame}')
        }

        return buttons
    }


    async onButtonClick(button, args) {
        if (button.id != 'scrape-game') {
            return
        }
        const game = await kernel.gamelist_getGameByHash(args)
        game.props.scrape.enable = true

        await kernel.broadcastPluginMethod('scraper-worker', `forceEnableScrape`, game, true)

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

    async queryInfoForGame(action, newargsinfo) {
        if (!newargsinfo) {
            newargsinfo = {}
        }
        if (!newargsinfo.tabs) {
            newargsinfo.tabs = {}
        }
        newargsinfo.tabs.scrape = newargsinfo.tabs.scrape || {}
        newargsinfo.tabs.scrape.order = "2"
        newargsinfo.tabs.scrape.title = await kernel.translateBlock('${lang.ge_scrape_tab}')
        newargsinfo.tabs.scrape.items = newargsinfo.tabs.scrape.items || {}

        //call queryInfoForGame for every "SCRAPE ENABLED" plugin    
        newargsinfo.tabs.scrape.items = (await kernel.broadcastPluginMethod('scraper-worker', `queryScrapeInfoForGame`, {
            enable: {
                type: "activable"
                , label: await kernel.translateBlock('${lang.ge_scrape_enable}')
                , activable_text: await kernel.translateBlock('${lang.ge_scrape_enable_text}')
                , note: await kernel.translateBlock('${lang.ge_scrape_enable_tip}')
                , default: true
            }
        })).returns.last

        return newargsinfo;
    }
}

module.exports = myplugin

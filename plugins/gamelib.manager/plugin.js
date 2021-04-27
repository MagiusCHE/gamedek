const fs = require("fs")
const mkdirp = require('mkdirp');
const path = require('path')
const util = require('util')

class myplugin extends global.Plugin {
    constructor(root, manifest) {
        super(root, manifest)

    }
    #root
    #lib_path
    #library
    #lastLibraryStart
    async init() {
        await super.init()
        this.#lastLibraryStart = new Date()
        this.#root = path.join(kernel.appDataRoot, 'library')
        this.#lib_path = path.join(this.#root, 'library.json')
        if (!fs.existsSync(this.#root)) {
            mkdirp.sync(this.#root)
        }
    }
    async loadLibrary() {
        this.log(`Loading library...`)
        if (fs.existsSync(this.#lib_path)) {
            this.#library = JSON.parse(fs.readFileSync(this.#lib_path).toString())
        } else {
            this.#library = {
                games: []
            }
        }

        if (fs.existsSync(this.#lib_path)) {
            this.#library.lastUpdate = fs.statSync(this.#lib_path).mtime
        } else {
            this.#library.lastUpdate = new Date()
        }

        await kernel.broadcastPluginMethod('gameengine', 'libraryLoaded', this.#library)

        this.log(`Loaded library (${this.#library.games.length} games).`)
    }
    async setGameStartedByHash(hash) {
        const exists = this.#library.games.find(g => g.hash == hash)
        if (!exists) {
            return
        }
        exists.lastStart = new Date()
        this.saveLibrary()

        kernel.sendEvent('onGameStatusChanged', hash)
    }
    async isGameEditableByHash(hash) {
        const ret = (await kernel.broadcastPluginMethod('gameengine', 'isGameEditableByHash', hash)).returns.last
        if (ret === undefined) {
            return true
        }
        return ret
    }
    async isGameStartedByHash(hash) {
        const game = this.#library.games.find(g => g.hash == hash)
        if (!game) {
            return false
        }
        if (game.lastStop && typeof game.lastStop == 'string') {
            game.lastStop = new Date(game.lastStop)
        }
        if (game.lastStart && typeof game.lastStart == 'string') {
            game.lastStart = new Date(game.lastStart)
        }
        return (game.lastStart && this.#lastLibraryStart < game.lastStart && (!game.lastStop || game.lastStart > game.lastStop)) ? game.lastStart : undefined
    }
    async applicationExit() {
        for (const game of this.#library.games) {
            if (game.lastStop && typeof game.lastStop == 'string') {
                game.lastStop = new Date(game.lastStop)
            }
            if (game.lastStart && typeof game.lastStart == 'string') {
                game.lastStart = new Date(game.lastStart)
            }
            if (game.lastStart && this.#lastLibraryStart < game.lastStart && (!game.lastStop || game.lastStart > game.lastStop)) {
                const ela = game.lastStop - game.lastStart
                game.playTime = (game.playTime || 0) + ela
            }
        }
        this.saveLibrary()
    }
    async setGameStoppedByHash(hash, log) {
        const exists = this.#library.games.find(g => g.hash == hash)
        if (!exists) {
            return
        }
        exists.lastStop = new Date()
        if (exists.lastStart && typeof exists.lastStart == 'string') {
            exists.lastStart = new Date(exists.lastStart)
        }
        if (exists.lastStart && this.#lastLibraryStart < exists.lastStart) {
            const ela = exists.lastStop - exists.lastStart
            exists.playTime = (exists.playTime || 0) + ela
        }
        exists.lastExecutionLog = log

        this.saveLibrary()

        kernel.sendEvent('onGameStatusChanged', hash)
    }
    async saveLibrary() {
        this.log(`Saving library (${this.#library.games.length} games)...`)
        fs.writeFileSync(this.#lib_path, JSON.stringify(this.#library))
        this.#library.lastUpdate = fs.statSync(this.#lib_path).mtime
        this.log('Library saved.')
    }
    async updateGame(info) {
        const hash = info.prev_hash || info.hash
        this.log(`Update game %o`, hash)
        const exists = this.#library.games.find(g => g.hash == hash)
        if (!exists) {
            throw new Error(util.format(`Missing game with hash %o`, hash))
        }
        //clear existing props
        if (exists != info) {
            for (const i in exists) {
                delete exists[i]
            }
            for (const i in info) {
                exists[i] = info[i]
            }
        }
        delete exists.prev_hash
        await this.saveLibrary()
    }
    async addNewGame(info) {
        this.log(`Added new game`, info)
        this.#library.games.push(info)
        await this.saveLibrary()
        return this.#library.games.length - 1
    }
    async getImportActions() {
        const actions = {}
        return await kernel.broadcastPluginMethod('gameengine', 'getImportAction', actions)
    }
    async getGamesCount() {
        return this.#library.games.length
    }
    async getLastModifiedTimeStamp() {
        return this.#library.lastUpdate
    }
    async getGames() {
        return this.#library.games
    }
    async onOnGuiAppearing() {
        this.log('Initialize. check libraries')
        await this.loadLibrary()
    }
    async onOnGuiAppeared() {
    }
}

module.exports = myplugin

const fs = require("fs")
const mkdirp = require('mkdirp');
const path = require('path')

class myplugin extends global.Plugin {
    constructor(root, manifest) {
        super(root, manifest)

    }
    #root
    #lib_path
    #library
    async init() {
        await super.init()
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
        this.#library.lastUpdate = fs.statSync(this.#lib_path).mtime

        await kernel.broadcastPluginMethod('gameengine', 'libraryLoaded', this.#library)

        this.log(`Loaded library (${this.#library.games.length} games).`)
    }
    async saveLibrary() {
        this.log(`Saving library (${this.#library.games.length} games)...`)
        fs.writeFileSync(this.#lib_path, JSON.stringify(this.#library))
        this.#library.lastUpdate = fs.statSync(this.#lib_path).mtime
        this.log('Library saved.')
    }
    async addNewGame(info) {
        this.log(`Adden new game`, info)
        this.#library.games.push(info)
        await this.saveLibrary()
        return this.#library.games.length - 1
    }
    async getImportActions() {
        const actions = {}
        await kernel.broadcastPluginMethod('gameengine', 'getImportAction', actions)
        return actions
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

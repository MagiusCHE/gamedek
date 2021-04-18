const fs = require('fs')
const md5 = require('md5')
const mkdirp = require('mkdirp')
const path = require('path')
const rimraf = require('rimraf')

class myplugin extends global.Plugin {
    constructor(root, manifest) {
        super(root, manifest)
    }
    #mediapath
    async init() {
        await super.init()
        this.#mediapath = path.join(kernel.appDataRoot, 'library', 'media')
        mkdirp.sync(this.#mediapath)
    }
    async libraryLoaded(library) {

        const dirs = fs.readdirSync(this.#mediapath)

        library.games.forEach(g => {
            if (!g.hash) {
                g.hash = this.generateGameHash(g)
                this.log(`Game "%s" has no hash. Recreate it = %s`, g.props.info.title, g.hash)
            }
            const d = dirs.indexOf(g.hash)
            if (d > -1) {
                dirs.splice(d, 1)
            }
        })

        if (dirs.length > 0) {
            this.log(`%s directories in %s will be removed due to missing game in library.`, dirs.length, this.#mediapath)
            for (const rem of dirs) {
                const dest = path.join(this.#mediapath, rem)
                rimraf.sync(dest)
            }
        }
    }
    generateGameHash(game) {
        return md5(game.props.info.title + '§' + game.props.info.year)
    }
    async confirmNewGameParams(info, returns) {
        const props = info.props
        if (returns.error) {
            return returns
        }
        if (!props.info.title) {
            returns.error = {
                title: await kernel.translateBlock('${lang.ge_com_info_required_title}'),
                message: await kernel.translateBlock('${lang.ge_com_info_required "' + await kernel.translateBlock('${lang.ge_com_info_tabinfo_title}') + '"}'),
            }
            returns.tab = 'info'
            returns.item = 'title'
        }
        if (!props.info.year) {
            returns.error = {
                title: await kernel.translateBlock('${lang.ge_com_info_required_title}'),
                message: await kernel.translateBlock('${lang.ge_com_info_required "' + await kernel.translateBlock('${lang.ge_com_info_tabinfo_year}') + '"}'),
            }
            returns.tab = 'info'
            returns.item = 'year'
        }

        const hash = this.generateGameHash(info)
        const exists = await kernel.gamelist_getGameByHash(hash)

        if (exists) {
            returns.error = {
                title: await kernel.translateBlock('${lang.ge_com_info_alreadyexists_title}'),
                message: await kernel.translateBlock('${lang.ge_com_info_alreadyexists}'),
            }
            returns.tab = 'info'
            returns.item = 'title'

            return returns
        }

        info.hash = hash

        //internalize images
        const tointernalize = ['imagelandscape', 'imageportrait', 'icon']
        const interalmediapath = path.join(this.#mediapath, hash)

        for (const toi of tointernalize) {
            if (!props.info[toi]) {
                continue
            }
            if (!fs.existsSync(props.info[toi])) {
                returns.error = {
                    title: await kernel.translateBlock('${lang.ge_com_info_filenotfound_title}'),
                    message: await kernel.translateBlock('${lang.ge_com_info_filenotfound "' + await kernel.translateBlock('${lang.ge_com_info_tabinfo_' + toi + '}') + '" "' + props.info[toi] + '"}'),
                }
                returns.tab = 'info'
                returns.item = toi

                return returns
            }
            if (props.info[toi].indexOf('@media://') == 0) {
                continue
            }
            const src = path.resolve(props.info[toi])
            const dst = path.join(interalmediapath, toi + path.extname(src))
            mkdirp.sync(interalmediapath)
            fs.copyFileSync(src, dst)
            props.info[toi] = '@media://' + toi + path.extname(src)
        }

        return returns
    }
    async convertGameInfo(gameinfo) {
        //in care we need to convert string jkson object into a valid datatype before passed to gui
        // For example DATETIME or Media
        const tointernalize = ['imagelandscape', 'imageportrait', 'icon']
        const interalmediapath = path.join(this.#mediapath, gameinfo.hash)
        const props = gameinfo.props
        for (const toi of tointernalize) {
            if (!props.info[toi]) {
                continue
            }
            if (props.info[toi].indexOf('@media://') > -1) {
                props.info[toi] = path.join(interalmediapath, props.info[toi].replace(/\@media:\/\//g, ''))
            }
        }
    }
    async queryInfoForNewGame(action, newargsinfo) {
        if (action.split('.')[0] != 'import') {
            return
        }
        if (!newargsinfo) {
            newargsinfo = {}
        }
        if (!newargsinfo.tabs) {
            newargsinfo.tabs = {}
        }

        newargsinfo.tabs.info = {
            title: await kernel.translateBlock('${lang.ge_com_info_tabinfo}')
            , items: {
                title: {
                    type: "text"
                    , label: await kernel.translateBlock('${lang.ge_com_info_tabinfo_title}')
                    , required: true
                },
                imagelandscape: {
                    type: "image"
                    , label: await kernel.translateBlock('${lang.ge_com_info_tabinfo_imagelandscape}')
                    , note: await kernel.translateBlock('${lang.ge_com_info_tabinfo_imagelandscape_tip}')
                    , filters: [
                        {
                            name: await kernel.translateBlock('${lang.ge_com_info_image_flabel}')
                            , extensions: ['jpg', 'png', 'gif']
                        }
                    ]
                },
                imageportrait: {
                    type: "image"
                    , label: await kernel.translateBlock('${lang.ge_com_info_tabinfo_imageportrait}')
                    , note: await kernel.translateBlock('${lang.ge_com_info_tabinfo_imageportrait_tip}')
                    , filters: [
                        {
                            name: await kernel.translateBlock('${lang.ge_com_info_image_flabel}')
                            , extensions: ['jpg', 'png', 'gif']
                        }
                    ]
                },
                icon: {
                    type: "image"
                    , label: await kernel.translateBlock('${lang.ge_com_info_tabinfo_icon}')
                    , filters: [
                        {
                            name: await kernel.translateBlock('${lang.ge_com_info_image_flabel}')
                            , extensions: ['jpg', 'png', 'gif']
                        }
                    ]
                },
                year: {
                    type: "select"
                    , label: await kernel.translateBlock('${lang.ge_com_info_tabinfo_year}')
                },
            }
        }
        const yopts = {}
        for (let h = new Date().getFullYear() + 1; h >= 2000; h--) {
            if (h == new Date().getFullYear()) {
                yopts['' + h] = {
                    title: '' + h
                    , selected: true
                }
            } else {
                yopts['' + h] = '' + h
            }
        }
        newargsinfo.tabs.info.items.year.opts = yopts
        return newargsinfo;
    }
}

module.exports = myplugin

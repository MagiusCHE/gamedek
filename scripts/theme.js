class Theme {
    static async create(manifest) {
        let classname = Theme

        if (await core.kernel.existsThemeFile('theme.js')) {
            await core.loadJS((await core.kernel.getThemeUrl('theme.js')))
            const simpleName = manifest.simpleName || manifest.name.split('.').pop()
            //console.log(`Waiting for "${manifest.name}" >> "Theme_${simpleName}"...`)
            await waitFor(() => core.boolEval('Theme_' + simpleName))
            classname = eval('Theme_' + simpleName)
        }

        const theme = new classname(manifest)

        await theme.init()

        return theme
    }
    #htmlpieces = {}
    #jsloaded = {}
    constructor(manifest) {
        this.manifest = manifest
    }
    #locale = undefined
    async init() {
        const jss = []
        const csss = []
        const csss_ctrl = []
        const towaitfor = []
        const images = []
        const htmls = {}
        if (this.manifest.views) {
            for (const tpl of this.manifest.views) {
                const page = 'views/' + tpl
                const js = await this.themeUrl(page + '.js')
                if (js) {
                    jss.push(js)
                    towaitfor.push('ThemeView_' + tpl)
                }
                const css = await this.themeUrl(page + '.css')
                if (css) {
                    csss.push(css)
                    csss_ctrl.push(tpl + '_loaded')
                }
                const html = await this.themeUrl(page + '.html')
                htmls[tpl] = html
            }
        }
        if (this.manifest.templates) {
            for (const tpl of this.manifest.templates) {
                if (tpl.endsWith('/*')) {
                    const newpath = tpl.split('/')
                    newpath.pop()
                    const all = await this.themeUrls(newpath.join('/'))
                    for (const html of all) {
                        const tname = html.split('/').pop().split('.')
                        tname.pop()
                        if (!html) {
                            throw new Error(`Cannot load "${html}"`)
                        }
                        htmls[tname.join('.')] = html
                    }
                } else {
                    const tname = tpl.split('/').pop().split('.')
                    tname.pop()
                    const html = await this.themeUrl(tpl)
                    if (!html) {
                        throw new Error(`Cannot load "${tpl}"`)
                    }
                    htmls[tname.join('.')] = html
                }
            }
        }
        if (this.manifest.scripts) {
            for (const script of this.manifest.scripts) {
                if (script.endsWith('/*')) {
                    const newpath = script.split('/')
                    newpath.pop()
                    const all = await this.themeUrls(newpath.join('/'))
                    for (const js of all) {
                        jss.push(js)
                    }
                } else {
                    const js = await this.themeUrl(script)
                    if (!js) {
                        this.logError('Missing js ', script)
                    } else {
                        jss.push(js)
                    }
                }
            }
        }
        if (this.manifest.styles) {
            for (const style in this.manifest.styles) {

                if (style.endsWith('/*')) {
                    const newpath = style.split('/')
                    newpath.pop()
                    const all = await this.themeUrls(newpath.join('/'))
                    for (const js of all) {
                        csss.push(js)
                        csss_ctrl.push(this.manifest.styles[style])
                    }
                } else {
                    const js = await this.themeUrl(style)
                    if (!js) {
                        this.logError('Missing css ', style)
                    } else {
                        csss.push(js)
                        csss_ctrl.push(this.manifest.styles[style])
                    }
                }
            }
        }
        if (this.manifest.images) {
            for (const image of this.manifest.images) {
                if (image.endsWith('/*')) {
                    const newpath = image.split('/')
                    newpath.pop()
                    const allimgs = await this.themeUrls(newpath.join('/'))
                    for (const img of allimgs) {
                        images.push(img)
                    }
                } else {
                    const imgpath = await this.themeUrl(image)
                    if (!imgpath) {
                        this.logError('Missing image', image)
                    } else {
                        images.push(imgpath)
                    }
                }
            }
        }
        let blockstoload = (Object.keys(htmls).length > 0 ? 1 : 0)
            + (images.length > 0 ? 1 : 0)
            + (csss.length > 0 ? 1 : 0)
            + (jss.length > 0 ? 1 : 0)
            + (towaitfor.length > 0 ? 1 : 0)
        //css,js,images,html

        this.log('Load theme blocks:', blockstoload)

        if (Object.keys(htmls).length > 0) {
            let tot = Object.keys(htmls).length
            for (const tpl in htmls) {
                const html = htmls[tpl]
                this.#htmlpieces[tpl] = $('<div></div>');
                if (core.options.log.loadhtml) {
                    this.log('Load HTML', html)
                }
                this.#htmlpieces[tpl].load(core.versionUrl(html), () => {
                    tot--
                    if (core.options.log.loadhtml) {
                        this.log('Loaded HTML', html)
                    }
                    if (tot == 0) {
                        blockstoload--
                    }
                })
            }
        }
        if (images.length > 0) {
            core.loadImages(images).then(() => blockstoload--)
        }
        if (csss.length > 0) {
            core.loadCSS(csss, csss_ctrl).then(() => blockstoload--)
        }
        if (jss.length > 0) {
            core.loadJS(jss).then(() => blockstoload--)
        }
        if (towaitfor.length > 0) {
            waitFor(() => {
                let passed = true
                for (const t of towaitfor) {
                    if (!core.boolEval(t)) {
                        passed = false
                        break
                    }
                }
                return passed
            }).then(() => { blockstoload-- })
        }
        await waitFor(() => blockstoload == 0)

        $(document).on('kernel.showProgress', async (ev, args) => {
            this.showModalProgress(args)
        })
        $(document).on('kernel.hideProgress', async (ev, args) => {
            this.hideModalProgress()
        })
        $(document).on('kernel.closeAllDialogs', async (ev, args) => {
            this.closeAllDialogs()
        })
        $(document).on('kernel.gameUpdated', async (ev, args) => {
            this.gameUpdated(args.hash,args.oldhash)
        })



        $(document).on('kernel.showMessage', async (ev, args) => {
            this.showMessage({
                type: args.type,
                title: args.title,
                ishtml: args.ishtml,
                message: args.body
            })
        })

        await this.setPage(this.manifest.entry)

        this.log('Loaded.')
    }
    async gameUpdated(hash,oldhash) {
        //a game is updated
    }
    async closeAllDialogs() {
        //need to be implemented by theme
    }
    async showMessage(args) {
        if (args.ishtml) {
            args.message = $(args.message).text()
            args.title = $(args.title).text()
        }
        await core.kernel.showMessageBoxSync(args)
    }
    async showModalProgress(args) {
        $('body').css('pointer-events', 'none')
    }
    async hideModalProgress(args) {
        $('body').css('pointer-events', '')
    }
    async themeUrl(relativePath) {
        if (await core.kernel.existsThemeFile(relativePath)) {
            return core.kernel.getThemeUrl(relativePath)
        } else {
            return undefined
        }
    }
    async themeUrls(relativePath) {
        return core.kernel.getThemeUrls(relativePath)
    }
    async updateTitle(title) {
        $('head title').html(core.options.windowTitle + (title ? (' &bull; ' + title) : ''))
    }
    async onBeforeInitialShow() {
        //first appear need to do something?
        const cont = $('<div id="gd-viewscontainer"></div>')
        $('body').append(cont)
    }
    #views = {}
    async onBeginViewShow() {
        //render actual view        
        await this.prepareCurrentView()
        await this.getCurrentView()?.obj.onBeginShow()
    }
    async resetView(id) {
        let classname
        try {
            classname = eval('ThemeView_' + id)
        } catch (err) {
            classname = eval('ThemeView')
        }
        this.#views[id] = {
            obj: new classname(id),
            cnt: $(`<div id="gd-view" data-gd-view="${id}">` + (await this.translateBlock(await this.getTemplate(id))) + '</div>')
        }
        await this.#views[id].obj.init(await this.#views[id].cnt)
    }
    async translateBlock(text) {
        return await core.kernel.translateBlock(text)
    }
    async getTemplate(id) {
        if (!this.#htmlpieces[id]) {
            throw new Error(`Missing template with name "${id}".`)
        }
        return this.#htmlpieces[id].html()
    }
    async onThemeAppeared() {

        await this.registerNavigationEvents()

        await core.kernel.fireOnGuiAppearing()
        await this.appearCurrentView()
        await this.appearedCurrentView()
        await core.kernel.fireOnGuiAppeared()
        await this.updateNavigableElements()
    }
    async changeView(pageid, args) {
        if (this.#visbilePageId == pageid) {
            return
        }
        await this.hideCurrentView()
        await this.setPage(pageid)

        await this.prepareCurrentView()
        await this.appearCurrentView(args)
        await this.appearedCurrentView()
        await this.updateNavigableElements()
    }
    async hideCurrentView() {        
        await this.getCurrentView()?.obj.onHide()
    }
    getCurrentView() {
        return this.getView(this.#visbilePageId)
    }
    getView(id) {
        return this.#views[id]
    }
    async prepareCurrentView() {
        $('body #gd-viewscontainer #gd-view').detach()

        if (!this.getCurrentView()) {
            await this.resetView(this.#visbilePageId)
        }
        const view = this.getCurrentView().cnt
        $('body #gd-viewscontainer').append(view)
        $('html').attr('data-gd-view', this.#visbilePageId)
    }
    async appearCurrentView(args) {
        await this.getCurrentView()?.obj.onAppear(args)
    }
    async appearedCurrentView() {
        await this.getCurrentView()?.obj.onAppeared()
    }
    #visbilePageId = undefined
    async setPage(pageid) {
        if (this.#visbilePageId == pageid) {
            return
        }
        this.#visbilePageId = pageid
    }
    log() {
        const margs = Array.from(arguments)
        margs.unshift(`${this.constructor.name}: ${this.manifest.name}`)
        core.log.apply(core, margs)
    }
    logError = function() {
        const margs = Array.from(arguments)
        margs.unshift(`${this.constructor.name}: ${this.manifest.name}`)
        core.logError.apply(core, margs)
    }

    async registerNavigationEvents() {
        $(document).on('keydown', ev => {
            this.log('key pressed', ev.originalEvent.which)

        })
    }

    #navElems
    #actualElem
    async updateNavigableElements() {
        const nav = {}

        $('[data-nav-group]').each(function() {
            const group = $(this).attr('data-nav-group')
            if (!nav[group]) {
                nav[group] = []
            }
            nav[group] = $(`[data-nav-group="${group}"][data-nav-index]`)
            nav[group].sort((a, b) => {
                if ($(a).attr('tabindex') < $(b).attr('tabindex')) {
                    return -1
                }
                if ($(a).attr('tabindex') > $(b).attr('tabindex')) {
                    return 1
                }
                return 0
            })
        })

        this.#navElems = nav
    }
}

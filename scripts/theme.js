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

        await this.setPage(this.manifest.entry)

        this.log('Loaded.')
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
        await this.#views[this.#visbilePageId]?.obj.onBeginShow()
    }
    async resetView(id) {
        const classname = eval('ThemeView_' + id)
        this.#views[id] = {
            obj: new classname(id),
            cnt: $(`<div id="gd-view" data-gd-view="${id}">` + (await this.translateBlock(await this.getTemplate(id))) + '</div>')
        }
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
        await core.kernel.fireOnGuiAppearing()
        await this.appearCurrentView()
        await this.appearedCurrentView()
        await core.kernel.fireOnGuiAppeared()
    }
    async changeView(pageid) {
        if (this.#visbilePageId == pageid) {
            return
        }
        await this.hideCurrentView()
        await this.setPage(pageid)

        await this.prepareCurrentView()
        await this.appearCurrentView()
        await this.appearedCurrentView()
    }
    async hideCurrentView() {
        await this.#views[this.#visbilePageId]?.obj.onHide()
    }
    async prepareCurrentView() {
        $('body #gd-viewscontainer #gd-view').remove()

        if (!this.#views[this.#visbilePageId]) {
            await this.resetView(this.#visbilePageId)
        }
        const view = this.#views[this.#visbilePageId].cnt
        $('body #gd-viewscontainer').append(view)
        $('html').attr('data-gd-view', this.#visbilePageId)
    }
    async appearCurrentView() {
        await this.#views[this.#visbilePageId]?.obj.onAppear()
    }
    async appearedCurrentView() {
        await this.#views[this.#visbilePageId]?.obj.onAppeared()
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
}

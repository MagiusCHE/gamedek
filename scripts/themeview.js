class ThemeView {
    constructor(id) {
        this.id = id
    }
    #templates = {}
    async init(control) {
        this.view = control
        const _this = this
        _this.log('Begin load templates.')
        this.view.find('.template').each(function() {

            const id = $(this).attr('id')
            _this.log('Loaded template', id)
            const tpl = $(this).removeAttr('id').removeClass('template').get(0).outerHTML
            _this.#templates[id] = tpl
            $(this).remove()
        })
    }
    getTemplateHtml(id) {
        return this.#templates[id]
    }
    async onBeginShow() {

    }
    async onAppear(args) {

    }
    async onAppeared() {

    }
    async onHide() {

    }
    log() {
        const margs = Array.from(arguments)
        margs.unshift(`${this.constructor.name}: ${this.id}`)
        core.log.apply(core, margs)
    }
    logError = function() {
        const margs = Array.from(arguments)
        margs.unshift(`${this.constructor.name}: ${this.id}`)
        core.logError.apply(core, margs)
    }
}
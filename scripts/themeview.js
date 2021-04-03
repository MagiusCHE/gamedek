class ThemeView {
    constructor(id) {
        this.id = id
    }
    async onBeginShow() {

    }
    async onAppear() {

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
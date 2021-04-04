class ThemeView_add extends ThemeView {
    #lastImportActionPressed
    async init(view) {
        await super.init(view)
        const actions = await core.kernel.gameList_getImportActions()
        for (const provider in actions) {
            for (const actionid in actions[provider]) {
                const action = actions[provider][actionid]
                const cnt = $(this.getTemplateHtml('import_action'))
                cnt.html(action.button)
                cnt.attr('data-provider', provider)
                cnt.attr('data-action', actionid)
                cnt.on('click', () => {
                    if (action.args) {
                        const info = {}
                        info[actionid] = action
                        this.#lastImportActionPressed = info
                        core.theme.changeView('addinfo')
                    } else {
                        core.kernel.pluginMethod(provider, 'onButtonClick', actionid)
                    }
                })
                view.find('#importmethods_tbox').append(cnt)
            }
        }
        this.log(actions)
    }
    getLastImportActionPressed() {
        return this.#lastImportActionPressed
    }
}

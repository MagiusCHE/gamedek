class ThemeView_addinfo extends ThemeView {
    async init(view) {
    }
    async onAppear() {
        await super.onAppear()
        const actioninfo = core.theme.getView('add').obj.getLastImportActionPressed()
        const actionid = Object.keys(actioninfo)[0]
        const action = actioninfo[actionid]

        $('#subtitle').html(action.short)
        $('#goback').attr('onclick', "$('#gd-header [data-view=\"add\"]').click()")
    }
}

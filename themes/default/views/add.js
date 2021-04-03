class ThemeView_add extends ThemeView {
    async onBeginShow() {
    }
    async onAppear() {
        this.log('begfin appear')
        //get all buttons
        const actions = await core.kernel.gameList_getImportActions()
        this.log(actions)
    }
}

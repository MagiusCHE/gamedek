class ThemeView_home extends ThemeView {
    async onBeginShow() {

    }
    async onAppear() {
        this.log('appear')
        if (await core.kernel.gameList_getGamesCount() == 0) {
            $('#nogameinlist').show();
            $('#gamegrid').hide();
        } else {
            $('#nogameinlist').hide();
            $('#gamegrid').show();
        }
    }
}

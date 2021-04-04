class ThemeView_home extends ThemeView {
    async onAppear() {
        await super.onAppear()
        if (await core.kernel.gameList_getGamesCount() == 0) {
            $('#nogameinlist').show();
            $('#gamegrid').hide();
        } else {
            $('#nogameinlist').hide();
            $('#gamegrid').show();
        }
    }
}

class ThemeView_home extends ThemeView {
    #gameListLastModifiedTime
    async onAppear() {
        await super.onAppear()
        if (await core.kernel.gameList_getGamesCount() == 0) {
            $('#nogameinlist').show();
            $('#gamegrid').hide();
        } else {
            $('#nogameinlist').hide();
            $('#gamegrid').show();
            await this.showList()
        }
    }
    async showList() {
        const lastMod = await core.kernel.gameList_getLastModifiedTimeStamp()

        if (this.#gameListLastModifiedTime == lastMod) {
            return
        }
        this.#gameListLastModifiedTime = lastMod
        const games = await core.kernel.gameList_getGamesFiltered()

        games.sort((a, b) => {
            if (a.props.info.title?.toLowerCase() < b.props.info.title?.toLowerCase()) {
                return -1
            }
            if (a.props.info.title?.toLowerCase() > b.props.info.title?.toLowerCase()) {
                return 1
            }
            return 0
        })

        $('#gamegrid').empty()
        for (const gameinfo of games) {
            const game = gameinfo.props
            const cnt = $(this.getTemplateHtml('gamelist_item'))
            cnt.find('.title').text(game.info.title)
            cnt.find('.year').text(game.info.year)
            cnt.find('.landscape').css('background-image', game.info.imagelandscape)
            cnt.find('.icon').css('background-image', game.info.icon)
            cnt.find('.portrait').css('background-image', game.info.imageportrait)
            if (game.info.tags) {
                for (const tag of game.info.tags) {
                    const tcnt = $(this.getTemplateHtml('gamelist_item_tag'))
                    tcnt.find('.text').text(tag.name)
                    tcnt.css('color', tag.color)
                    cnt.find('.tags').append(tcnt)
                }
            }
            core.theme.onNewElementAdded(cnt)
            $('#gamegrid').append(cnt)
        }
    }
}

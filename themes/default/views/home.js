class ThemeView_home extends ThemeView {
    #gameListLastModifiedTime
    async init(w) {
        await super.init(w)
        if (!$('html').attr('data-gamelist-style')) {
            $('html').attr('data-gamelist-style', 'block')
        }

        $(document).on('kernel.onGameStatusChanged', async (ev, args) => {
            this.log('Received kernel.onGameStatusChanged', args)
            if (await core.kernel.gameList_isGameStartedByHash(args)) {
                $(`[data-game-hash="${args}"]`).addClass('game-running')
                $(`[data-game-hash="${args}"] .col-buttons .game-terminating`).removeClass('game-terminating')

            } else {
                $(`[data-game-hash="${args}"]`).removeClass('game-running')
                $(`[data-game-hash="${args}"] .col-buttons .game-starting`).removeClass('game-starting')
            }
        })
    }
    async onAppear(args) {
        await super.onAppear(args)
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
        const games = await core.kernel.gameList_getGamesFiltered(undefined, true)

        games.sort((a, b) => {
            if (a.props.info.title?.toLowerCase() < b.props.info.title?.toLowerCase()) {
                return -1
            }
            if (a.props.info.title?.toLowerCase() > b.props.info.title?.toLowerCase()) {
                return 1
            }
            return 0
        })

        $('#gamegrid .gameitem').remove()
        for (const gameinfo of games) {
            //for (let h = 0; h < 100; h++) {
            const game = gameinfo.props
            const cnt = $(this.getTemplateHtml('gamelist_item'))

            cnt.attr('data-hash', gameinfo.hash)
            cnt.find('.title').text(game.info.title)
            cnt.find('.year').text(game.info.year)

            if (game.info.icon) {
                cnt.find('.icon').css('background-image', `url('${game.info.icon}')`)
            }

            if (game.info.imagelandscape) {
                cnt.find('.imagelandscape').css('background-image', `url('${game.info.imagelandscape}')`)
            } else if (game.info.imageportrait) {
                cnt.find('.imagelandscape').css('background-image', `url('${game.info.imageportrait}')`)
            }
            if (game.info.imageportrait) {
                cnt.find('.imageportrait').css('background-image', `url('${game.info.imageportrait}')`)
            } else if (game.info.imagelandscape) {
                cnt.find('.imageportrait').css('background-image', `url('${game.info.imagelandscape}')`)
            }
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
            //}
        }
    }
    async selectGame(hash) {
        const gameinfo = await core.kernel.gamelist_getGameByHash(hash, true)
        //this.log(gameinfo)

        const body = $(this.getTemplateHtml('game_dialog'))
        const game = gameinfo.props
        if (game.info.imagelandscape || game.info.imageportrait) {
            body.find('.col-info').css('background-image', `url('${game.info.imagelandscape || game.info.imageportrait}')`)
        }

        const gameisstarted = await core.kernel.gameList_isGameStartedByHash(gameinfo.hash)


        body.find('.btn-edit').on('click', async () => {
            core.theme.changeView('addinfo', gameinfo)
        })

        body.find('.btn-stop').on('click', async () => {
            body.find('.btn-stop').addClass('game-terminating')
            await core.kernel.forceCloseGameByHash(gameinfo.hash)
        })


        body.find('.btn-start').on('click', async (e) => {
            body.find('.btn-start').addClass('game-starting')
            const ret = (await core.kernel.startGameByHash(gameinfo.hash)).returns?.last
            //
            this.log(ret)
            if (ret.error) {
                body.find('.btn-start').removeClass('game-starting')
                await core.theme.showDialog({
                    title: ret.error.title,
                    body: ret.error.message + '<p class="game-error text-danger">' + ret.exit.log + '</p>',
                    understand: true
                })

            }
            e.preventDefault()
            return false
        })

        //body.find('.col-info').

        await core.theme.showDialog({
            title: gameinfo.props.info.title
            , body: body
            , onPreShow: (modal) => {
                $(modal).attr('data-game-hash', gameinfo.hash)
                $(modal).find(`.col-buttons .game-terminating`).removeClass('game-terminating')
                $(modal).find(`.col-buttons .game-starting`).removeClass('game-starting')
                if (gameisstarted) {
                    $(modal).addClass('game-running')
                } else {
                    $(modal).removeClass('game-running')
                }
            }
        })
    }
}

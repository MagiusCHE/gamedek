class Theme_default extends Theme {
    #firstAppear = true
    async init(manifest) {
        await super.init(manifest)
        this.log('initialized')
    }
    async hideCurrentView() {
        super.hideCurrentView()
        await new Promise(resolve => {
            $('#app-view').animate({ opacity: 0 }, 300, resolve)
        })
    }
    async prepareCurrentView() {
        await super.prepareCurrentView()
        let header;
        if ($('#gd-header').length == 0) {
            header = $(await this.translateBlock(await this.getTemplate('header')))
            $('#gd-viewscontainer').append(header)
        }
        if (this.#firstAppear) {
            $('#gd-view').css({ opacity: 0 })
            await this.showGreatLoader('initialization_pleasewait')
        } else {
            $('#app-view').css({ opacity: 0 })
        }
    }
    async appearCurrentView() {
        super.appearCurrentView()
        await new Promise(resolve => {
            if (this.#firstAppear) {
                $('#gd-view').animate({ opacity: 1 }, 600, resolve)
            } else {
                $('#app-view').animate({ opacity: 1 }, 600, resolve)
            }

        })
    }

    async appearedCurrentView() {
        await super.appearedCurrentView()
        if (this.#firstAppear) {
            await this.hideGreatLoader()
        }
        this.#firstAppear = false
    }

    async onThemeAppeared() {
        await super.onThemeAppeared()
        //const games = await core.kernel.gameList_getGamesCount();
    }

    async updateGreatLoader(message, target) {
        $('#great-loader .message ' + target).html(await this.translateBlock('${lang.' + message + '}'))
    }
    async showGreatLoader(message) {
        let loader = $('#great-loader')
        if (loader.length == 0) {
            loader = $(await this.translateBlock(await this.getTemplate('gloader')))
            $('body').append(loader)
        }
        if (message) {
            $('#great-loader .message').html(await this.translateBlock('${lang.' + message + '}'))
        }
        $('#great-loader').css('opacity', 0)
        $('body').addClass('loading')
        $('#great-loader').animate({ opacity: 1 })
    }
    async hideGreatLoader() {
        $('body').removeClass('loading')
        $('#great-loader').animate({ opacity: 0 })
    }
}
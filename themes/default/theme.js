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
        for (const cnt of this.#activateToolTips) {
            cnt.tooltip('dispose');
        }
        this.#activateToolTips.length = 0

        //$('body #gd-view .tooltip').remove()
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
            await this.showGreatLoader(await this.translateBlock('${lang.initialization_pleasewait}'))
        } else {
            $('#app-view').css({ opacity: 0 })
        }

        await waitFor(() => $(document).tooltip)

        await this.onNewElementAdded($('#gd-viewscontainer'))
    }
    async appearCurrentView(args) {
        super.appearCurrentView(args)
        await new Promise(resolve => {
            if (this.#firstAppear) {
                $('#gd-view').animate({ opacity: 1 }, 600, resolve)
            } else {
                $('#app-view').animate({ opacity: 1 }, 600, resolve)
            }

        })
    }
    async selectGame(hash) {
        await this.getCurrentView()?.obj.selectGame(hash)
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
    }

    async updateGreatLoader(message, target) {
        $('#great-loader .message ' + target).html(await this.translateBlock('${lang.' + message + '}'))
    }
    async showModalProgress(message) {
        await this.showGreatLoader(message)
    }
    async hideModalProgress() {
        await this.hideGreatLoader()
    }
    async showGreatLoader(message) {
        let loader = $('#great-loader')
        if (loader.length == 0) {
            loader = $(await this.translateBlock(await this.getTemplate('gloader')))
            $('body').append(loader)
        }
        if (message) {
            $('#great-loader .message').html(message)
        }
        $('#great-loader').css('opacity', 0)
        $('body').addClass('loading')
        $('#great-loader').animate({ opacity: 1 })
    }
    async hideGreatLoader() {
        $('body').removeClass('loading')
        $('#great-loader').animate({ opacity: 0 })
    }

    #activateToolTips = []
    async onNewElementAdded(control) {
        const _this = this
        control = $(control)
        await this.meOrChild(control, '[title]', cnt => {
            cnt.tooltip()
            this.#activateToolTips.push(cnt)
        })
    }
    async meOrChild(control, selector, cb) {
        control = $(control)
        if (control.is(selector)) {
            cb($(control))
        }
        control.find(selector).each(function() {
            cb($(this))
        })
    }
    async setGridListView() {
        $('html').attr('data-gamelist-style', 'list')
    }
    async cycleGridBlockView() {
        $('html').attr('data-gamelist-style', 'block')
        $('#gamegrid').toggleClass('portrait')
    }

    /* {
        title
        ,body
        ,understand = add ok button
        ,onPreShow
        ,onPreHide
        ,
    } */
    async showDialog(options) {
        return new Promise(async (resolve) => {
            const modal = $(await this.translateBlock(await this.getTemplate('modal')))
            modal.find('.modal-title').empty().append(options.title)
            modal.find('.modal-body').empty().append(options.body)
            if (options.understand) {
                modal.find('.modal-footer').html(`<button type="button" class="btn btn-secondary" data-dismiss="modal">${await core.kernel.translateBlock('${lang.dialog_ok}')}</button>`)
            }
            $('body').append(modal)
            if (options.onPreShow) {
                await options.onPreShow(modal)
            }

            modal.on('hide.bs.modal', async function(event) {
                if (options.onPreHide) {
                    await options.onPreHide(modal)
                }
            })
            modal.on('hidden.bs.modal', function(event) {
                resolve(modal)
                modal.remove()
            })

            modal.modal('show')
        })
    }
}
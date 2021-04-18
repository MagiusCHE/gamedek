class ThemeView_addinfo extends ThemeView {
    async init(view) {
        await super.init(view)
        view.find('#ge_save_changes').on('click', async () => {
            //collect info
            const reqs = this.#lastRequestedInfo
            const setted = {
                props: {},
                provider: this.#lastActionProvider
            }
            for (const tabid in reqs.tabs) {
                const tab = reqs.tabs[tabid]
                setted.props[tabid] = {}
                for (const itemname in tab.items) {
                    const thisuid = `${tabid}_${itemname}`
                    const item = tab.items[itemname]
                    const value = $('#' + thisuid).val()
                    setted.props[tabid][itemname] = value
                    if (!value && item.required) {
                        await core.theme.showDialog({
                            title: await core.kernel.translateBlock('${lang.ge_com_info_required_title}'),
                            body: await core.kernel.translateBlock('${lang.ge_com_info_required "' + item.label + '"}'),
                            understand: true
                        })
                        $('#tab-btn-' + tabid).click()
                        $('#' + thisuid).focus();
                        return
                    }
                }
            }

            let response = await core.kernel.broadcastPluginMethod('gameengine', `confirmNewGameParams`, setted, {})
            let ret = response.returns.last
            this.log(response)
            if (!ret.error) {

                ret = (await core.kernel.broadcastPluginMethod('gameengine', `createNewGame`, response.args[0])).returns.last
            }

            if (!ret.error) {

                core.theme.changeView('home')
            } else {
                await core.theme.showDialog({
                    title: ret.error.title,
                    body: ret.error.message,
                    understand: true
                })
                if (ret.tab) {
                    $('#tab-btn-' + ret.tab).click()
                    if (ret.item) {
                        $('#' + `${ret.tab}_${ret.item}`).focus();
                    }
                }
            }
        })
    }
    #lastRequestedInfo
    #lastActionProvider
    async onAppear() {
        const _this = this
        await super.onAppear()
        const actioninfo = core.theme.getView('add').obj.getLastImportActionPressed()

        const actionid = Object.keys(actioninfo)[0]
        const action = actioninfo[actionid]

        $('#subtitle').html(action.short)
        $('#goback').attr('onclick', "$('#gd-header [data-view=\"add\"]').click()")

        const reqs = (await core.kernel.broadcastPluginMethod('gameengine', `queryInfoForNewGame`, actionid, {})).returns.last
        this.#lastActionProvider = actionid
        this.#lastRequestedInfo = reqs

        this.log(reqs)

        $('.nav-tabs').empty()
        $('.tab-content').empty()
        this.#storedInfo = {}

        for (const tabid in reqs.tabs) {
            const tab = reqs.tabs[tabid]
            const tabbtn = $(this.getTemplateHtml('tab_btn'))
            tabbtn.find('a').attr('id', 'tab-btn-' + tabid)
                .attr('href', '#tab-pan-' + tabid)
                .attr('aria-controls', 'tab-pan-' + tabid)
                .html(tab.title)
            core.theme.onNewElementAdded(tabbtn)
            $('.nav-tabs').append(tabbtn)
            const panel = $(this.getTemplateHtml('tab_panel'))
            panel.attr('id', 'tab-pan-' + tabid)
                .attr('aria-labelledby', 'tab-btn-' + tabid)


            for (const itemname in tab.items) {
                const thisuid = `${tabid}_${itemname}`
                const valuecont = $(`<div class="valuecont col-sm-9"></div>`)
                const cont = $(`<div class="form-group row" data-item="${thisuid}"></div>`)
                const item = tab.items[itemname]
                cont.append($(`<label class="col-sm-3 col-form-label" for="${thisuid}">${item.label}${item.required ? (' <span class="required">*</span>') : ''}</label>`))

                let value
                let browse = false
                if (item.type == 'file') {
                    browse = {
                        icon: 'insert_drive_file',
                        prop: 'openFile'
                    }
                } else if (item.type == 'folder') {
                    browse = {
                        icon: 'folder',
                        prop: 'openDirectory'
                    }
                } else if (item.type == 'text') {
                    value = $(`<input type="text" class="form-control-plaintext value" id="${thisuid}"/>`)
                    valuecont.append(value)
                } else if (item.type == 'image') {
                    browse = {
                        icon: 'insert_photo',
                        prop: 'openFile'
                    }
                } else if (item.type == 'select') {
                    value = $(`<select class="form-control-plaintext value" id="${thisuid}"></select>`)
                    for (const optval in item.opts) {
                        const opt = item.opts[optval]
                        const optcnt = $(`<option value="${optval}">${opt.title || opt}</option>`)
                        value.append(optcnt)
                        if (opt.selected) {
                            optcnt.attr('selected', 'selected')
                        }
                    }
                    valuecont.append(value)
                }

                if (browse) {
                    valuecont.addClass('filebrowser')
                    const browsebtn = $(`<span class="material-icons-outlined btn_browse" title="${await core.kernel.translateBlock('${lang.browse}')}">${browse.icon}</span>`)
                    value = $(`<input type="text" class="form-control-plaintext value" id="${thisuid}"/>`)
                    browsebtn.on('click', function() {
                        core.kernel.showOpenDialog({
                            properties: [browse.prop]
                            , filters: item.filters
                        }).then(ret => {
                            _this.log(ret)
                            if (!ret.canceled) {
                                value.val(ret.filePaths.length > 0 ? ret.filePaths[0] : '')
                            }
                        })
                    })
                    valuecont.append(value)
                    valuecont.append(browsebtn)

                }

                if (item.note) {
                    value.on('focus', () => {
                        $('.note').html(item.note)
                    })
                }
                value.on('blur', () => {
                    $('.note').empty()
                })
                cont.append(valuecont)
                panel.append(cont)
            }

            $('.tab-content').append(panel)
            core.theme.onNewElementAdded(panel)
        }

        $('.nav-tabs .nav-link').first().click();

    }
    #storedInfo = {}
}

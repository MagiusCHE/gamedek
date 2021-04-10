class myplugin extends global.Plugin {
    constructor(root, manifest) {
        super(root, manifest)
    }
    async init() {
        await super.init()
    }
    async confirmNewGame(tabs, returns) {
        if (returns.error) {
            return
        }
        if (!tabs.info.title) {
            returns.error = {
                title: await kernel.translateBlock('${lang.ge_com_info_required_title}'),
                message: await kernel.translateBlock('${lang.ge_com_info_required "' + await kernel.translateBlock('${lang.ge_com_info_tabinfo_title}') + '"}'),
            }
            returns.tab = 'info'
            returns.item = 'title'
        }
        return returns
    }
    async queryInfoForNewGame(action, newargsinfo) {
        if (action.split('.')[0] != 'import') {
            return
        }
        if (!newargsinfo) {
            newargsinfo = {}
        }
        if (!newargsinfo.tabs) {
            newargsinfo.tabs = {}
        }

        newargsinfo.tabs.info = {
            title: await kernel.translateBlock('${lang.ge_com_info_tabinfo}')
            , items: {
                title: {
                    type: "text"
                    , label: await kernel.translateBlock('${lang.ge_com_info_tabinfo_title}')
                    , required: true
                },
                imagelandscape: {
                    type: "image"
                    , label: await kernel.translateBlock('${lang.ge_com_info_tabinfo_imgland}')
                    , filters: [
                        {
                            name: await kernel.translateBlock('${lang.ge_com_info_image_flabel}')
                            , extensions: ['jpg', 'png', 'gif']
                        }
                    ]
                },
                imageportrait: {
                    type: "image"
                    , label: await kernel.translateBlock('${lang.ge_com_info_tabinfo_imgport}')
                    , filters: [
                        {
                            name: await kernel.translateBlock('${lang.ge_com_info_image_flabel}')
                            , extensions: ['jpg', 'png', 'gif']
                        }
                    ]
                },
                icon: {
                    type: "image"
                    , label: await kernel.translateBlock('${lang.ge_com_info_tabinfo_icon}')
                    , filters: [
                        {
                            name: await kernel.translateBlock('${lang.ge_com_info_image_flabel}')
                            , extensions: ['jpg', 'png', 'gif']
                        }
                    ]
                },
                year: {
                    type: "select"
                    , label: await kernel.translateBlock('${lang.ge_com_info_tabinfo_year}')
                },
            }
        }
        const yopts = {}
        for (let h = new Date().getFullYear() + 1; h >= 2000; h--) {
            if (h == new Date().getFullYear()) {
                yopts['' + h] = {
                    title: '' + h
                    , selected: true
                }
            } else {
                yopts['' + h] = '' + h
            }
        }
        newargsinfo.tabs.info.items.year.opts = yopts
        return newargsinfo;
    }
}

module.exports = myplugin

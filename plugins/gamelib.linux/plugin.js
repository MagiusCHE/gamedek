const fs = require("fs")

class myplugin extends global.Plugin {
    constructor(root, manifest) {
        super(root, manifest)
    }
    async init() {
        await super.init()
    }
    async getImportAction(actions) {
        if (!actions['gameengine']) {
            actions['gameengine'] = {}
        }
        actions['gameengine']['import.linux'] = {
            button: await kernel.translateBlock('${lang.ge_import_linux}'),
            short: await kernel.translateBlock('${lang.ge_import_linux_short}'),
            args: true
        }
    }
    async createNewGame(info, returns) {
        returns = returns || {}
        if (info.provider != 'import.linux') {
            return returns
        }
        const tabs = info.tabs

        if (returns.handled) {
            return returns
        }

        await kernel.gameList_addNewGame(info)

        returns.handled = true

        return returns
    }
    async confirmNewGameParams(info, returns) {
        if (info.provider != 'import.linux') {
            return returns
        }
        const props = info.props

        if (returns.error) {
            return returns
        }
        if (!props.executable.executable) {
            returns.error = {
                title: await kernel.translateBlock('${lang.ge_com_info_required_title}'),
                message: await kernel.translateBlock('${lang.ge_com_info_required "' + await kernel.translateBlock('${lang.ge_il_info_binary}') + '"}'),
            }
            returns.tab = 'executable'
            returns.item = 'executable'
        }
        if (!fs.existsSync(props.executable.executable) || !fs.statSync(props.executable.executable).isFile()) {
            returns.error = {
                title: await kernel.translateBlock('${lang.ge_com_info_filenotfound_title}'),
                message: await kernel.translateBlock('${lang.ge_com_info_filenotfound "' + await kernel.translateBlock('${lang.ge_il_info_binary}') + '" "' + props.executable.executable + '"}'),
            }
            returns.tab = 'executable'
            returns.item = 'executable'
        }
        return returns
    }
    async queryInfoForNewGame(action, newargsinfo) {
        if (action != 'import.linux') {
            return
        }
        if (!newargsinfo) {
            newargsinfo = {}
        }
        if (!newargsinfo.tabs) {
            newargsinfo.tabs = {}
        }
        newargsinfo.tabs.executable = {
            title: await kernel.translateBlock('${lang.ge_il_info_tabexe}')
            , items: {
                executable: {
                    type: "file"
                    , filters: [
                        {
                            name: await kernel.translateBlock('${lang.ge_il_info_binary_flabel}')
                            , extensions: ['*']
                        }
                    ]
                    , label: await kernel.translateBlock('${lang.ge_il_info_binary}')
                    , required: true
                },
                arguments: {
                    type: "text"
                    , label: await kernel.translateBlock('${lang.ge_il_info_arguments}')
                },
                workdir: {
                    type: "folder"
                    , label: await kernel.translateBlock('${lang.ge_il_info_folder}')
                }
            }
        }
        return newargsinfo;
    }
}

module.exports = myplugin

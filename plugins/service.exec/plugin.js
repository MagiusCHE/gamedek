const fs = require("fs")
const mkdirp = require('mkdirp')
const path = require('path')
const rimraf = require('rimraf')
const spawn = require("child_process").spawn;

class myplugin extends global.Plugin {
    constructor(root, manifest) {
        super(root, manifest)
    }
    async init() {
        await super.init()
    }
    #activebin = {}
    async forceCloseBinByPid(pid, signal) {
        this.log('forceCloseBinByPid: close process with pid %o', pid)
        if (this.#activebin[pid]) {
            this.#activebin[pid].process.kill(signal || 'SIGTERM')
        }
        return new Promise(async resolve => {
            while (true) {
                const ret = await this.getReturnsBinByPid(pid, true)
                if (!this.#activebin[pid]) {
                    this.log('forceCloseBinByPid: process %o is terminated', pid)
                    resolve()
                    return
                }
                await new Promise(r => setTimeout(r, 100))
            }
        })
    }
    async getReturnsBinByPid(pid, purgeifexited) {
        const ret = this.#activebin[pid]
        if (purgeifexited && ret && ret?.returns?.exit?.code !== undefined) {
            delete this.#activebin[pid]
        }
        if (!ret) {
            return
        }
        return {
            inputs: ret.inputs,
            returns: ret.returns
        }
    }
    /*
    executable: "/path to exec"
    arguments: [] or "<spaces separated args>"
    handled: if this executioon is already handled
    
    all others props will be copied into spawn options ( see: https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options )
    */
    async spawnBinOrScript(args, returns) {
        //args.cwd = args.cwd || 
        returns = returns || {}
        if (returns.handled) {
            return returns
        }
        returns.handled = true

        const err_title = await kernel.translateBlock('${lang.service_execerror_title}')
        const err_msg = await kernel.translateBlock('${lang.service_execerror}')

        return new Promise(async (resolve) => {
            const log = []
            const err = []
            let startupFinalize = async (child, error) => {
                const pid = child?.pid
                startupFinalize = () => { }
                if (error) {
                    if (pid) {
                        delete this.#activebin[pid]
                    }
                    this.logError(error)
                }
                // Handle exit
                returns.pid = pid
                returns.exit = {
                    log: log.join('\n'),
                    err: err.join('\n')
                }

                if (error) {
                    returns.error = {
                        title: err_title,
                        message: err_msg
                    }
                }
                if (pid) {
                    this.#activebin[pid] =
                    {
                        process: child,
                        returns: returns,
                        inputs: args
                    }
                }
                resolve(returns)
            }
            let finalize = async (child, code) => {
                const pid = child?.pid
                finalize = () => { }

                let error
                if (code != 0) {
                    error = new Error(`Error: process exited with code ${code}`)
                    this.logError(error)
                }

                returns.pid = pid
                returns.exit = {
                    code: code,
                    log: log.join('\n'),
                    err: err.join('\n')
                }

                if (error) {
                    returns.error = {
                        title: err_title,
                        message: err_msg
                    }
                }

                this.#activebin[pid].returns = returns

                await kernel.broadcastPluginMethod(undefined, 'binExecutonTerminated', pid)
                kernel.sendEvent('binExecutonTerminated', pid)
            }

            const separatedargs = (args.arguments && Array.isArray(args.arguments))
                ? args.arguments
                : (args.arguments != "" ? args.arguments.match(/"[^"]+"|'[^']+'|\S+/g) : [])
            //separatedargs = game.props.executable.arguments.split(' ')

            let exec
            try {
                exec = spawn(
                    args.executable
                    , separatedargs
                    , {
                        ...{
                            detached: true
                        }, ...args
                    }
                );
                startupFinalize(exec)
            } catch (er) {
                startupFinalize(exec, er)
                return
            }

            exec.on('error', (er) => {
                startupFinalize(exec, er)
            })

            exec.stdout.on("data", (data) => {
                log.push(data)
            });

            exec.stderr.on("data", (er) => {
                // Handle error...
                log.push(er)
                err.push(er)
            });

            exec.on("exit", (code) => {
                finalize(exec, (code === undefined || code === null) ? 0 : code)
            });
        })
    }
    async updateGame(info, returns) {
        returns = returns || {}
        if (info.provider != 'import.linux') {
            return returns
        }
        if (returns.handled) {
            return returns
        }
        await kernel.gameList_updateGame(info)

        returns.handled = true

        return returns
    }
    async createNewGame(info, returns) {
        returns = returns || {}
        if (info.provider != 'import.linux') {
            return returns
        }
        if (returns.handled) {
            return returns
        }

        await kernel.gameList_addNewGame(info)

        returns.handled = true

        return returns
    }
    async confirmGameParams(info, returns) {
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
    async queryInfoForGame(action, newargsinfo) {
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
            order: "1"
            , title: await kernel.translateBlock('${lang.ge_il_info_tabexe}')
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

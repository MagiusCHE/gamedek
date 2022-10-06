// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, MenuItem, globalShortcut, shell, dialog } = require('electron')
const electron = require('electron')
const path = require('path')

const defaultMenu = require('electron-default-menu');
const argsObj = require('command-line-parser')();

let _cachedDefaultMenu

if (!argsObj.develop) {
    process.env.NODE_ENV = 'production'
}

global.production = process.env.NODE_ENV == 'production'

function createWindow() {
    // Create the browser window.
    const mainScreen = electron.screen.getPrimaryDisplay()

    const mainWindow = new BrowserWindow({
        width: Math.min(1280, mainScreen.size.width),
        height: Math.min(800, mainScreen.size.height),
        webPreferences: {
            preload: path.join(__dirname, './server/preload.js'),
            contextIsolation: false,
            nodeIntegration: true,
            backgroundThrottling: false,
        },
        show: false, //argsObj.develop ? true : false,
        frame: true,
    })

    const kernel = require('./server/kernel')

    if (!global.production) {
        mainWindow.show()
    } else {
        mainWindow.setMenu(null)
    }

    kernel.init()

    //}
    globalShortcut.register('F11', () => {
        if (mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(false)
            if (!global.production) {
                mainWindow.setMenu(_cachedDefaultMenu)
            }
        } else {
            if (!global.production) {
                if (!_cachedDefaultMenu) {
                    _cachedDefaultMenu = Menu.buildFromTemplate(defaultMenu(app, shell))
                }
            }
            mainWindow.setFullScreen(true)
            if (!global.production) {
                mainWindow.setMenu(null)
            }
        }
    })

    kernel.mainWindow = mainWindow
    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    if (kernel.initError) {
        app.quit();
    }

    mainWindow.once('ready-to-show', () => {
        //debug
        //mainWindow.webContents.openDevTools()
        //console.log(mainWindow.webContents)

        //mainWindow.webContents.send('CBKernel', CBKernel);

    })
}
// Open the DevTools.
// mainWindow.webContents.openDevTools()


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
    if (argsObj.debugger) {
        setTimeout(createWindow, 1000)
    } else {
        createWindow()
    }
})

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

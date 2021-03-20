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

function createWindow() {
    // Create the browser window.
    const mainScreen = electron.screen.getPrimaryDisplay()

    const mainWindow = new BrowserWindow({
        width: mainScreen.size.width,
        height: mainScreen.size.height,
        webPreferences: {
            preload: path.join(__dirname, './server/preload.js'),
            contextIsolation: false,
            //nodeIntegration: false,
            //enableRemoteModule: true
        },
        show: true, //argsObj.develop ? true : false,
        frame: argsObj.develop ? true : false,
    })

    const kernel = require('./server/kernel')

    kernel.init()

    globalShortcut.register('F11', () => {
        console.log('F11 pressed')
        if (mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(false)
            mainWindow.setMenu(_cachedDefaultMenu)
        } else {
            if (!_cachedDefaultMenu) {
                _cachedDefaultMenu = Menu.buildFromTemplate(defaultMenu(app, shell))
            }
            mainWindow.setFullScreen(true)
            mainWindow.setMenu(null)
        }
    })
    //}

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

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

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

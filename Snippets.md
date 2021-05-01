# Code Snippets and TODO
## Disable screensaver
### Linux KDE/Plasma
```while /bin/true
do 
qdbus org.freedesktop.ScreenSaver /ScreenSaver SimulateUserActivity > /dev/null; 
sleep 1m; 
done```

## Electron-builder Package.json
```
 "release": "electron-builder",
    "dist:linux": "yarn release -l",
    "dist:linux:deb": "yarn release -l deb",
    "dist:linux:targz": "yarn release -l tar.gz",
    "dist:linux:appimage": "yarn release -l AppImage",
    "dist:linux:snap": "yarn release -l snap",
    "dist:win": "yarn release -w",
    "publish:draft:_common": "yarn release --publish always",
    "publish:draft:linux": "yarn publish:draft:_common -l",
    "publish:draft:win": "yarn publish:draft:_common -w",
    "publish:draft": "yarn publish:draft:_common -wl",
```
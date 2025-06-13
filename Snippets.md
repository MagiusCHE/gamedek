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
    "dist:linux": "npm run release -- -l",
    "dist:linux:deb": "npm run release -- -l deb",
    "dist:linux:targz": "npm run release -- -l tar.gz",
    "dist:linux:appimage": "npm run release -- -l AppImage",
    "dist:linux:snap": "npm run release -- -l snap",
    "dist:win": "npm run release -- -w",
    "publish:draft:_common": "npm run release -- --publish always",
    "publish:draft:linux": "npm run publish:draft:_common -- -l",
    "publish:draft:win": "npm run publish:draft:_common -- -w",
    "publish:draft": "npm run publish:draft:_common -- -wl",
```
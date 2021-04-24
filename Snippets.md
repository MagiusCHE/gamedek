# Code Snippets and TODO
## Disable screensaver
### Linux KDE/Plasma
```while /bin/true
do 
qdbus org.freedesktop.ScreenSaver /ScreenSaver SimulateUserActivity > /dev/null; 
sleep 1m; 
done```
## Lutris ADDON
- need SQLite for `~/.local/share/lutris/pga.db`
- single yaml at `~/.config/lutris/games/`
- execute `lutris lutris:rungameid/22`
- execute post script '/usr/bin/pkill lutris'

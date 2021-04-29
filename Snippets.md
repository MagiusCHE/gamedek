# Code Snippets and TODO
## Disable screensaver
### Linux KDE/Plasma
```while /bin/true
do 
qdbus org.freedesktop.ScreenSaver /ScreenSaver SimulateUserActivity > /dev/null; 
sleep 1m; 
done```

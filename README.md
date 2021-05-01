[![Build Status](https://travis-ci.org/MagiusCHE/gamedek.svg?branch=prod)](https://travis-ci.org/MagiusCHE/gamedek)

# GameDek
Fancy, themable, multilanguage, moddable panel to place all game links.

![immagine](https://user-images.githubusercontent.com/46496052/116122893-a1011100-a6c2-11eb-8446-49a992aec9ae.png)

![immagine](https://user-images.githubusercontent.com/46496052/116122955-afe7c380-a6c2-11eb-974c-5875b0a21cd5.png)

![immagine](https://user-images.githubusercontent.com/46496052/116123009-c0983980-a6c2-11eb-97e5-d92912836dee.png)

![immagine](https://user-images.githubusercontent.com/46496052/116123083-dd347180-a6c2-11eb-9a1f-3872ddbf4155.png)

## Build
- Clone entire project
- `yarn update`
- `yarn dist:linux:unpacked` (or any other dist)
- install package in your os specified folder.
  - for arch linux install it in `/opt/gamedek` (or use `yarn aur-install`)
- `yarn local-update-plugins-themes` to use all plugins and default theme
- `gamedek` to launch it!

## Travis-CI in Prod
- Every pull in `prod` will trigger Travis compilation and release.

## Credits
- for Core:
  - https://jquery.com/
  - https://github.com/emn178/js-md5
- for default theme:
  - https://getbootstrap.com/
  - https://jqueryui.com/
  - https://bootswatch.com/darkly/
  - https://fonts.google.com/icons
  - https://popper.js.org/
  - https://animate.style/

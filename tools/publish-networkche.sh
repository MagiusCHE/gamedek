set -e
DESTIP=pc-irene-x
SOURCEPKG=$(ls -t1 archlinux-aur/*.zst | head -n 1)
SOURCEEXTRAS="dist/extras.7z"

echo ">> GameDek syncronization to $DESTIP"

mkdir -p "dist"
if [ -f $SOURCEEXTRAS ]; then
    rm -f $SOURCEEXTRAS
fi

echo " - Compressing extras..."
7za a $SOURCEEXTRAS themes/* plugins/*

DESTEXTRAS="/home/irene/.local/share/GameDek"    
echo " - Publishing to GameDek..."
DESTIP="192.168.1.225"
ping $DESTIP -c 1 || DESTIP="192.168.1.189"

scp $SOURCEPKG $DESTIP:./
scp $SOURCEEXTRAS $DESTIP:./

PKG=$(basename $SOURCEPKG)
EXTRAS=$(basename $SOURCEEXTRAS)
REMOTEPWD=$(ssh $DESTIP "pwd") # versione più concisa
# echo "FUORI $REMOTEPWD"
ssh $DESTIP << SSHSTRING
    yay -U --noconfirm $PKG
    # Extraxt 7zip archive to $DESTEXTRAS as su
    sudo 7za x -y -o$DESTEXTRAS $REMOTEPWD/$EXTRAS
    # sudo ls -laht $DESTEXTRAS
    sudo chown -R irene:irene $DESTEXTRAS
    rm -f $PKG
    rm -f $EXTRAS
SSHSTRING
echo "<< GameDek syncronization completed."
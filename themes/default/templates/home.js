(function() {
    core.views.home = {
        eanblebackgroundMoveOnMouse: true,
        show: function(cb) {
            $this.content.find('#newgame').click(() => {
                core.startNewGame();
            });

            $this.content.find('#exit').click(() => {
                core.exit();
            });
            log('Can continue in home start')

            core.views.ingame.canContinue().then(can => {
                log('Can continue in home', can)
                if (!can) {
                    $this.content.find('#continue').addClass('disabled');
                }

                $this.content.find('#continue').click(function() {
                    if ($(this).is('.disabled')) {
                        return;
                    }
                    core.enterInGame();
                });

                $this.content.find('#options').click(function() {
                    core.showOptions();
                });

                core.audio.play('mus_home', {
                    onerror: function() {
                        core.audioAutoFail = true;
                    },
                });

                if (cb) {
                    cb();
                }
            })
        },
    };
    const $this = core.views.home;
    // eslint-disable-next-line no-unused-vars
    const log = core.log
})();

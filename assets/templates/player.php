<header data-player class="header str-el">

        <audio></audio>

        <div class="header__img-wrapper float-l" onmousedown="return false;">
            <img data-player-field="main-img" src="<?= ICONS ?>no-songs.svg" alt="song-img">
        </div>

        <div class="primary-player float-r">
            <div class="title-song">
                <span data-player-field="name" class="title-song__name">Best music</span>
                <span data-player-field="author" class="title-song__author">to add songs click the "plus" icon below</span>
            </div>

            <div class="primary-controls">

                <div class="seek">
                    <span data-player-field="current-time" class="seek__time --current"></span><!--
                 --><span data-player-field="duration" class="seek__time --duration"></span>

                    <div class="seek__progress-bar" data-progress-bar data-value="0" data-max="0">
                        <div class="progress-bar__seek" data-seek></div>
                    </div>
                </div>

                <div class="primary-controls__buttons">
                    <div class="buttons__btn">
                        <img data-player-field="playPrev" class="turn-l" src="<?= ICONS ?>rewind-l.svg" alt="">
                    </div><!--
                 --><div class="buttons__btn">
                        <img data-player-field="play" class="play" src="<?= ICONS ?>play.svg" alt="">
                    </div><!--
                 --><div class="buttons__btn">
                        <img data-player-field="playNext" class="turn-r" src="<?= ICONS ?>rewind-r.svg" alt="">
                    </div>

                    <div data-player-field="misc-btns" class="float-r">
                        <div class="buttons__btn">
                            <img data-player-field="shuffle" class="shuffle" src="<?= ICONS ?>shuffle.svg" alt="">
                        </div><!--
                     --><div class="buttons__btn">
                            <img data-player-field="repeatAll" class="repeat buttons__btn--non-active" src="<?= ICONS ?>repeat.svg" alt="">
                        </div><!--
                     --><div class="buttons__btn">
                            <img data-player-field="volume" class="volume" src="<?= ICONS ?>volume.svg" alt="">
                            <div data-player-field="volumeChanger" data-value="100" data-max="100" class="btn__volume-changer">
                                <div class="volume-changer__seek" data-seek></div>
                            </div>
                        </div><!--
                     --><div class="buttons__btn">
                            <img data-player-field="add" class="add" src="<?= ICONS ?>add.svg" alt="">
                        </div>
                    </div>
                </div>
            </div>
        </div>

    <?php if ( !$_SESSION['auth']['is_user_authorized'] ) : ?>
        <div class="header-log-in-button">
           <img id="login-button" src="<?= ICONS ?>log-in-button.svg" alt="">
        </div>
    <?php endif; ?>

</header>
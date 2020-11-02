<?php

/* Connects JavaScript file to page
 * This function guarantees that one script will not be connected twice
 *
 * @var string $script_name - the name of the script to be connected
 * @return void
 */
function enqueue_script($script_name) {
    static $enqueued_scripts = [];

    if ( $enqueued_scripts[ $script_name ] ) return 0;

    echo '<script src="'.SCRIPTS_JS.$script_name.'"></script>';
    $enqueued_scripts[] = $script_name;
    
}

echo '<!DOCTYPE html>';
echo '<html lang="en">';

require TEMPLATES . 'head.php';

echo '<body>';

echo '<div class="container">';

require TEMPLATES . 'player.php';

require TEMPLATES . 'playlist.php';

if ( !$_SESSION['auth']['is_user_authorized'] ) {
    require TEMPLATES . 'registration-form.php';
}

echo '</div>';

echo '<script type="text/javascript">
    window.audio           = document.querySelector("audio");
    window.playerHTML      = document.querySelector("*[data-player]");
    window.playlistHTML    = document.querySelector("*[data-playlist]");
    window.currentPlaylist = null;
</script>';

if ( !$_SESSION['auth']['is_user_authorized'] ) {
    enqueue_script('register.js');
}

enqueue_script('song.js');
enqueue_script('data.js');
enqueue_script('playlist.js');
enqueue_script('main.js');

echo '</body>';
echo '</html>';
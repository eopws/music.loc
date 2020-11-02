<?php

session_start();

/*
 * Defining pathes
 */

define('ABSPATH', __DIR__ . '/');
define('SCRIPTS_JS', '/assets/js/');
define('STYLES', ABSPATH . 'assets/styles/');
define('ICONS', '/assets/icons/');
define('IMAGES', '/assets/images/');
define('TEMPLATES', ABSPATH . 'assets/templates/');
define('SCRIPTS_PHP', ABSPATH . 'php/');

// Connect database
require SCRIPTS_PHP . 'DB_class.php';

// Connect the authentication script
require SCRIPTS_PHP . 'authentication.php';

// handling queries
require SCRIPTS_PHP . 'queries_handler.php';

// start output
require SCRIPTS_PHP . 'template.php';
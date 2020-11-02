<?php

// if the user is authorized change nothing, set $_SESSION['auth']['is_user_authorized'] = false otherwise
$_SESSION['auth']['is_user_authorized'] = $_SESSION['auth']['is_user_authorized'] ?? false;

if ( isset($_COOKIE['login']) && !$_SESSION['auth']['is_user_authorized'] ) {
    $db = Database::get_db_object();

    $ip = $_SERVER['REMOTE_ADDR'];
    $user_agent = $_SERVER['HTTP_USER_AGENT'];
    $hash = md5($_COOKIE['login']);

    $session = $db->get_results("SELECT * FROM `sessions` WHERE `ip` = ? AND `user_agent` = ? AND `hash` = ?", [$ip, $user_agent, $hash])[0];

    if ( $session !== 'empty' ) {
        $_SESSION['auth']['is_user_authorized'] = true;
        $_SESSION['auth']['user_id'] = $session['user_id'];
    }
}

if ( isset($_POST['auth_type']) ) {
    if ( $_SESSION['auth']['is_user_authorized'] ) die("The user is already authorized");

    // authorize the user
    if ( $_POST['auth_type'] == 'sign-in' ) {
        $sign_in_message = user_sign_in();

        if ( $sign_in_message !== 'true' ) {
            echo $sign_in_message;
            die();
        }
    }

    if ( $_POST['auth_type'] == 'new-account' ) {
        $register_message = user_register();

        if ( $register_message !== 'true' ) {
            echo $register_message;
            die();
        }
    }

    die('true'); // nothing else needs to be done, true indicates success
}

/*
 * Called when a guest tries to create new account
 * This method takes user's data (email, password) from $_POST
 *
 * @return string - 'true' if registration was successful, error message otherwise
 * */
function user_register(): string {
    // database interface
    $db = Database::get_db_object();

    /*
     * validating mail
     * */
    $mail = trim($_POST['mail']);

    if ( !filter_var($mail, FILTER_VALIDATE_EMAIL) ) return 'mail::Invalid mail';

    $user_exists = $db->get_results("SELECT * FROM `users` WHERE `mail` = ?", [$mail]);

    if ( $user_exists[0] !== 'empty' ) return 'mail::A user with this mail already exists';

    /*
     * validating password
     * */
    $password = $_POST['password'];

    if ( strlen($password) < 7 || strlen($password) > 15 ) return 'password::Password length must be greater than 6 and less than 16';

    $password = password_hash($password, PASSWORD_DEFAULT); // get password hash

    $user_id = $db->insert("INSERT INTO `users` VALUES (NULL, ?, ?)", [$mail, $password]);

    // authorize the user after registration

    $_SESSION['auth']['is_user_authorized'] = true;
    $_SESSION['auth']['user_id'] = $user_id;

    if ( $_POST['remeber'] ) set_login_cookie($mail, $password, $user_id);

    return 'true';
}

/*
 * Called when a user tries to log in
 *
 * @return string - 'true' if authorization was successful, error message otherwise
 * */
function user_sign_in(): string {
    // database interface
    $db = Database::get_db_object();

    $mail = trim($_POST['mail']);
    $password = $_POST['password'];

    if ($mail === '') return 'mail::Empty mail';
    if ($password === '') return 'password::Empty password';

    if ( !@filter_var($mail, FILTER_VALIDATE_EMAIL) ) return 'mail::Invalid mail';

    $user = $db->get_results("SELECT * FROM `users` WHERE `mail` = ?", [$mail])[0]; // there can be only one row

    if ( $user === 'empty' ) return 'mail::A user with this mail does not exist';

    if ( !password_verify($_POST['password'], $user['password']) ) {
        return 'password::Incorrect password';
    }

    // everything is fine, we can authorize the user

    $_SESSION['auth']['is_user_authorized'] = true;
    $_SESSION['auth']['user_id'] = $user['id'];

    if ( $_POST['remeber'] ) set_login_cookie($mail, $user['password'], $user['id']);

    return 'true';
}

/*
 * Sets cookie used to remeber the user
 *
 * @var $login - current user login
 * @var $password - current user password hash
 * @var $user_id - current user id
 * @return void
 */
function set_login_cookie($login, $password, $user_id) {
    $db = Database::get_db_object();

    $user_agent = $_SERVER['HTTP_USER_AGENT'];

    $cookie_content = md5($password.$user_agent);

    $ip = $_SERVER['REMOTE_ADDR'];

    $does_session_exist = $db->get_results("SELECT * FROM `sessions` WHERE `ip` = ? AND `user_agent` = ? AND `hash` = ?", [$ip, $user_agent, md5($cookie_content)])[0];

    if ( $does_session_exist === 'empty' )
        $id = $db->insert("INSERT INTO `sessions` VALUES(NULL, ?, ?, ?, ?, ?)", [$user_id, $ip, $user_agent, time(), md5($cookie_content)]);

    setcookie('login', $cookie_content, time() + 60 * 60 * 24 * 14);
}
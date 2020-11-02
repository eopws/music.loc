<?php

/*
 * This file is created to process requests
 */

// get user songs handler
if ( isset($_POST['getUserSongs']) ) {
	if ( !$_SESSION['auth']['is_user_authorized'] ) die('false');

	// connect simpleHTMLDOM parser
	require_once SCRIPTS_PHP . 'simpleHTMLDOMparser/simple_html_dom.php';

	$db = Database::get_db_object();

	$user_id = $_SESSION['auth']['user_id'];

	$user_songs_ids = $db->get_results("SELECT `song_id` FROM `songs_entities` WHERE `song_entity_id` = ? AND `song_entity_type` = 'users' LIMIT 20", [$user_id]);

	$songs = [];

	if ($user_songs_ids[0] !== 'empty') {
		foreach ($user_songs_ids as $song_id) {
			$song_id = $song_id['song_id'];

			// array splice deletes id
			$song = array_splice($db->get_results("SELECT * FROM `songs` WHERE `id` = ?", [$song_id])[0], 1);

			// song page on zaycev.net(used to get song URL)
			$song_DOM = file_get_html('https://zaycev.net' . $song['songURL']);

			$song['z_url'] = $song['songURL'];

			$song_URL = file_get_contents( 'https://zaycev.net' . $song_DOM->find('.musicset-track', 0)->attr['data-url']);

			$song['songURL'] = json_decode($song_URL)->url;

			$songs[] = $song;
		}

	 	echo json_encode($songs);
	} else echo "false";

	die();
}

// search handler
if ( isset($_POST['search']) || isset($_POST['searchRequestAdditional']) ) {
	// connect simpleHTMLDOM parser
	require_once SCRIPTS_PHP . 'simpleHTMLDOMparser/simple_html_dom.php';

	if ( isset($_POST['searchRequestAdditional']) )
		$search_string = $_SESSION['search_string'];
	else {
		$search_string = $_SESSION['search_string'] = trim($_POST['search']);
		if ( $search_string == '' ) die('404');

		$_SESSION['songs_load_count'] = 20;
	}

	// the parser parses songs from zaycev.net
	$zaycev_net_search_dom = file_get_html( 'https://zaycev.net/search.html?query_search=' . urlencode($search_string) );

	$song_objects = [];

	$songs_HTML = $zaycev_net_search_dom->find('.musicset-track-list__items', 0)->find('.musicset-track');

	if ( $songs_HTML == '' ) die('404');

	$songs_count = count( $songs_HTML );

	$i = 0;
	$max = 20;

	if ( isset($_POST['searchRequestAdditional']) ) {
		$from = $_SESSION['songs_load_count'];

		$songs_HTML = array_slice($songs_HTML, $from, 5);

		$_SESSION['songs_load_count'] = $from + 5;
	}

	foreach ($songs_HTML as $mp3) {
		if (++$i > $max) break;

		// array used to group song data
		$song = [];

		$url = json_decode(file_get_contents( 'https://zaycev.net' . $mp3->attr['data-url'] ));

		$song['songURL'] = $url->url;

		// url of the page of the song on zaycev.net(used because of url on zaycev.net changes often)
		$song['z_url'] = $mp3->find('.musicset-track__link', 1)->href;

		$title = $mp3->find('.musicset-track__fullname', 0);

		$song['author'] = $title->find('.musicset-track__artist', 0)->plaintext;
		$song['name'] = $title->find('.musicset-track__track-name', 0)->plaintext;

		$time = $mp3->find('.musicset-track__duration', 0)->plaintext;

		$song['duration'] = $mp3->attr['data-duration'];

		$song_objects[] = $song;
	}

	// not found
	if ( empty($song_objects) ) die('404');

	// send found songs
	echo json_encode($song_objects);
	die();
}

// save user songs to database
if ($_GET['save']) {
	// don't save unauthorized user songs
	if ( !$_SESSION['auth']['is_user_authorized'] ) die;

	$songs_to_save = file_get_contents('php://input');

	$songs_to_save = json_decode($songs_to_save);

	$db = Database::get_db_object();

	foreach ($songs_to_save as $song) {
		$song_URL = $song->_z_url;
		$song_name = $song->_name;
		$song_author = $song->_author;
		$song_duration = $song->_duration;

		if (
			!$song_URL ||
			!$song_name ||
			!$song_author ||
			!$song_duration
		) die;

		// validate input data
		if ( !filter_var('https://zaycev.net' . $song_URL, FILTER_VALIDATE_URL) ) die;
		if ( !filter_var($song_duration, FILTER_VALIDATE_INT) ) die;

		$id = $db->insert("INSERT INTO `songs` VALUES (NULL, ?, ?, ?, ?)", [$song_name, $song_author, $song_duration, $song_URL]);

		if ( $id === -1 ) { // if the song alredy exists add row only into `songs_entities`
			$id = $db->get_results("SELECT `id` FROM `songs` WHERE `songURL` = ?", [$song_URL])[0]['id'];
		}

		$does_user_has_the_songs = $db->get_results("SELECT `song_id` FROM `songs_entities` WHERE `song_id` = ? AND `song_entity_id` = ? AND `song_entity_type` = 'users'", [$id, $_SESSION['auth']['user_id']])[0];

		if ( $does_user_has_the_songs == 'empty' )
			$db->insert("INSERT INTO `songs_entities` VALUES (?, ?, ?)", [$id, $_SESSION['auth']['user_id'], 'users']);
	}

	die;
}

// query to delete user songs
if ($_GET['delete']) {
	// don't delete unauthorized user song
	if ( !$_SESSION['auth']['is_user_authorized'] ) die;

	$songs_to_delete = file_get_contents('php://input');

	$songs_to_delete = json_decode($songs_to_delete);

	$db = Database::get_db_object();

	foreach ($songs_to_delete as $song) {
		$song_URL = $song->_z_url;
		$song_name = $song->_name;
		$song_author = $song->_author;
		$song_duration = $song->_duration;

		if (
			!$song_URL ||
			!$song_name ||
			!$song_author ||
			!$song_duration
		) die;

		// validate input data
		if ( !filter_var('https://zaycev.net' . $song_URL, FILTER_VALIDATE_URL) ) die;
		if ( !filter_var($song_duration, FILTER_VALIDATE_INT) ) die;

		$id = $db->get_results("SELECT `id` FROM `songs` WHERE `name` = ? AND `author` = ? AND `duration` = ? AND `songURL` = ?", [$song_name, $song_author, $song_duration, $song_URL])[0];

		if (!$id) die;

		$id = $id['id'];

		if ( $id !== 0 && !$id ) die;

		$db->query("DELETE FROM `songs` WHERE `id` = ?", [$id]);

		$db->query("DELETE FROM `songs_entities` WHERE `song_id` = ? AND `song_entity_id` = ? AND `song_entity_type` = 'users'", [$id, $_SESSION['auth']['user_id']]);
	}

	die;
}
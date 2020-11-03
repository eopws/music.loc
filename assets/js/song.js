/*
 Class of song. Song is a unit of playlist object
 */

class Song {
	constructor(songURL, name, author, duration, z_url) {
		this._songURL = songURL; // path to an audio file
		this._name = name;
		this._author = author;
		this._duration = duration;

		this._id = 0;
		this._newSong = false; // true if the user did not have such a song( not use in search playlist )

		// for server
		this._z_url = z_url;
	}

	/*
	 Get property(all properties) of this song. Can't access internal properties
	 */
	getProperty(name, all = false) {
		if (all === true) {
			return {
				id: this._id,
				songURL: this._songURL,
				name: this._name,
				author: this._author,
				duration: this._duration
			};
		}

		if ( !this.hasOwnProperty('_' + name) ) throw new Error('trying to get non-existent property');

		return this['_' + name];
	}

	/*
	 Set property of this song. Can't change internal properties
	 */
	setProperty(name, value) {
		if ( !this.hasOwnProperty('_' + name) ) throw new Error('property creation is prohibited');

		this['_' + name] = value;
	}
}

let songLoop; // for progress bar changing

/*
 Play current song
 */
function songPlay() {
	/*
	 Changing Song object
	 */
	if ( songLoop ) return 0;

	if ( !window.audio.paused ) window.audio.pause();
	
	// we cannot play an audio track if it doesn't exist
	if ( !window.audio.src ) return;

	window.audio.play();

	songLoop = setInterval( sec => {
		if (window.audio.ended) {
			songPause();
			seekUpdate(0);
			window.currentPlaylist.doAction('playNext');
			return 0;
		}

		seekUpdate(window.audio.currentTime);
	}, 200);

	/*
	 Changing Player HTML
	 */

	let playIcon = window.playerHTML.querySelector('img[data-player-field="play"]');

	if (playIcon) {
		playIcon.src = "/assets/icons/pause.svg";
		playIcon.dataset.playerField = 'pause';
	}

	let currentSong = window.playlistHTML.querySelector('.playlist-ul__item[data-playing]');

	if (currentSong) {
		currentSong.querySelector('img[data-pl-field="svg-play"]').src = '/assets/icons/pause-playlist.svg';
	}
}

/*
 Pause playing song
 */
function songPause() {
	/*
	 Changing Song object
	 */

	if (!songLoop) return 0;

	window.audio.pause();

	clearInterval(songLoop);
	songLoop = null;

	/*
	 Changing player HTML
	 */

	let playIcon = window.playerHTML.querySelector('img[data-player-field="pause"]');

	if (playIcon) {
		playIcon.src = "/assets/icons/play.svg";
		playIcon.dataset.playerField = 'play';
	}

	let currentSong = document.querySelector('.playlist-ul__item[data-playing]');

	if (currentSong) {
		currentSong.querySelector('img[data-pl-field="svg-play"]').src = '/assets/icons/play-playlist.svg';
	}
}

function changeVolume(volumeValue) {
	if ( volumeValue == 'unmute' ) {
		window.audio.muted = false;
		return 0;
	}

	if ( volumeValue < 0 || volumeValue > 1 ) throw new Error('invalid volume value');

	if ( volumeValue === 0 ) {
		window.audio.muted = true;
		return 0;
	}

	window.audio.muted = false;
	window.audio.volume = volumeValue;
}

/*
 Updates HTML seek
 */
function seekUpdate(sec) {

	window.playerHTML.querySelector('span[data-player-field="current-time"]').textContent = convertTime(sec);

	let progressBar = window.playerHTML.querySelector('div[data-progress-bar]');
	let seek = progressBar.querySelector('div[data-seek]');

	if ( progressBar.hasAttribute('data-changing') ) return 0;

	progressBar.dataset.max = window.audio.duration;

	progressBar.dataset.value = sec;

	seek.style.width = (progressBar.dataset.value * 100 / progressBar.dataset.max) + '%';
}

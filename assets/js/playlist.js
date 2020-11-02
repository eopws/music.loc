class Playlist {
	constructor(name) {
		this._list = []; // array of songs
		this._currentSongId = -1;
		this._repeats = false; // play again if the playlist is over
		this._isCurrentPlaylist = false; // is the playlist playing now
		this._name = name; // name of the playlist

		/*
		 * When user deletes song, the song gets buffered
		 * When the buffer is full(100 songs) we send query  to the server
		 */
		this._songsToDeleteBuffer = [];
	}

	/*
	 This method allows you to interact with the playlist. Use it for all playlist actions, excepts render
	 */
	doAction(action, ...options) {
		switch(action) {
			case 'songChange':
				if (!this._isCurrentPlaylist) return 0;

				this._songChange(...options);
			break;

			case 'songAdd':
				let isSongInPlaylist = this._list.find(function(item) {
					return item.getProperty('z_url') == options[0].getProperty('z_url');
				});

				if (isSongInPlaylist) return false;

				this._songAdd(...options);
			break;

			case 'songsAdd':
				this._songsAdd(...options);
			break;

			case 'songRemove':
				this._songRemove(...options);
			break;

			case 'clearPlaylist':
				this._currentSongId = -1;
				this._list = [];
			break;

			// sets the playlist as current
			case 'setPlaylistAsCurrent':
				if (this._isCurrentPlaylist) return 0;

				if (window.currentPlaylist) window.currentPlaylist._unsetPlaylistAsCurrent();

				window.currentPlaylist = this;
				this._isCurrentPlaylist = true;

				window.playlistHTML.innerHTML = '';
				this.render();
			break;

			case 'playPrev':
				this._playPrev();
			break;

			case 'playNext':
				this._playNext();
			break;

			case 'shuffle':
				this._shuffle();
			break;

			case 'repeatAll':
				this._repeats = !this._repeats;

				let repeatIcon = window.playerHTML.querySelector('img[data-player-field="repeatAll"]');

				if (repeatIcon) {
					if (this._repeats) repeatIcon.classList.remove('buttons__btn--non-active');
					else repeatIcon.classList.add('buttons__btn--non-active');
				}
			break;

			case 'getPlName':
				return this._name;
			break;

			case 'getSong':
				return this._getSong(...options);
			break;
		}
	}

	/*
	 Set a song with given id as playing. If play == true, play the song
	 */
	_songChange(songId, play = false) {
		if (!this._isCurrentPlaylist) return 0;

		/*
		 Changing Playlist object
		 */

		let newSong = this._getSong(songId);

		if (!newSong) throw new Error('no such song in the playlist');

		seekUpdate(0);

		let currentSong = this._getSong(this._currentSongId);

		if (currentSong) {
			if ( newSong.getProperty('songURL') == currentSong.getProperty('songURL') ) return 0;
		}

		if ( window.audio.src ) songPause();

		this._currentSongId = songId;

		window.audio.src = newSong.getProperty('songURL');

		/*
		 Changing DOM
		 */

		let currentSongHTML = window.playlistHTML.querySelector(`div[data-playing]`);

		if (currentSongHTML) {
			currentSongHTML.removeAttribute('data-playing');
		}

		let newSongHTML = window.playlistHTML.querySelector(`div[data-id="${songId}"]`);

		if (newSongHTML) {
			newSongHTML.setAttribute('data-playing', '');
		}

		window.playerHTML.querySelector('*[data-player-field="main-img"]').src = '/assets/icons/song-img.png';

		let name = newSong.getProperty('name');
		name = name.length > 40 ? name.slice(0, 39) + '&hellip;' : name;

		let author = newSong.getProperty('author');
		author = author.length > 40 ? author.slice(0, 39) + '&hellip;' : author;

		// innerHTML because of mnemonics are allowed
		window.playerHTML.querySelector('span[data-player-field="name"]').innerHTML = name;
		window.playerHTML.querySelector('span[data-player-field="author"]').innerHTML = author;

		window.audio.onloadedmetadata = function() {
			window.playerHTML.querySelector('span[data-player-field="duration"]').textContent = convertTime( this.duration );
		}

		if (play == true) songPlay();
	}

	/*
	 Add a song to playlist, not render it
	 */
	_songAdd(song, setAsCurrent = false) {
		if (!window.audio.src && this._currentSongId == -1) setAsCurrent = true; // if there is no playing song, set given as current

		let newSongId = this._list.length > 0 ? this._list[this._list.length-1].getProperty('id') + 1 : 0;
		song.setProperty('id', newSongId);

		this._list.push(song);

		let newSongzurl = song.getProperty('z_url');

		this._songsToDeleteBuffer.find(function(item, index, array) {
			if ( item.getProperty('z_url') == newSongzurl ) {
				delete array[index];
				return true;
			}
		});

		if (setAsCurrent == true) {
			this.doAction( 'songChange', song.getProperty('id') );
		}
	}

	/*
	 Adds songs to playlist. Takes one parameter type of Iterable object of songs
	 */
	_songsAdd(songs) {
		for (let song of songs) {
			this.doAction('songAdd', song);
		}
	}

	/*
	 Removes the song with given ID from the playlist
	 */

	_songRemove(songId) {
		if ( this._name == 'search' ) return 0; // cannot remove song from found songs

		let songToDeleteIndex; // for turning next song

		let songToDelete = this._list.find(function(item, index) {
			if ( item.getProperty('id') == songId ) {
				songToDeleteIndex = index;
				return true;
			}
		});

		if (!songToDelete) return 0; // if the song is not found

		if (this._list.length == 1) { // deleting the last song
			window.playerHTML.querySelector('[data-player-field="main-img"]').src = '/assets/icons/no-songs.svg';

			window.playerHTML.querySelector('[data-player-field="name"]').textContent = 'Best music';
			window.playerHTML.querySelector('[data-player-field="author"]').textContent = 'to add songs click the "plus" icon below';

			let pauseBtn = window.playerHTML.querySelector('[data-player-field="pause"]');
			if (pauseBtn) pauseBtn.src = '/assets/icons/play.svg';

			window.audio.src = '';

			window.playerHTML.querySelector('span[data-player-field="current-time"]').textContent = '00:00';
			window.playerHTML.querySelector('span[data-player-field="current-time"]').textContent = '00:00';

			window.playerHTML.querySelector('div[data-progress-bar]').querySelector('[data-seek]').style.width = '0%';

			songToDeleteIndex = -1; // there is no next song
			this._currentSongId = -1;
		}

		// deleting a song that playing now
		if ( songId == this._currentSongId  ) {
			songPause();

			// turn on the next song if it exists
			if ( songToDeleteIndex != -1 ) { 
				let nextSongId = this._list[ songToDeleteIndex+1 ];

				if (!nextSongId) nextSongId = this._list[ songToDeleteIndex-1 ]; // cannot turn on the next song. Turn on the previous song

				nextSongId = nextSongId.getProperty('id');

				this.doAction( 'songChange', nextSongId );
			}
		}

		// remove fields from songs to reduce the size
		delete songToDelete._id;
		delete songToDelete._newSong;
		delete songToDelete._songURL;

		this._songsToDeleteBuffer.push(songToDelete);

		if ( this._songsToDeleteBuffer.length >= 100 ) {
			deleteUserSongs( this._songsToDeleteBuffer )
				.then( () => this._songsToDeleteBuffer = [] );
		}

		this._list.splice( this._list.indexOf(songToDelete), 1 );

		window.playlistHTML.querySelector('.playlist-ul__item[data-id="'+songId+'"]').remove(); // remove from playlist
	}

	/*
	 Returns a song object by given id
	*/
	_getSong(songId) {
		return this._list.find( item => item.getProperty('id') == songId );
	}

	// Returns songs that the user has recently added
	getNewUserSongs() {
		return this._list.filter( item => item.getProperty('newSong') );
	}

	getDeleteSongsBuffer() {
		return this._songsToDeleteBuffer;
	}

	/*
	 use only with 'setPlaylistAsCurrent'
	 */
	_unsetPlaylistAsCurrent() {
		if (this._isCurrentPlaylist == false) return 0;

		let currentSong = this._getSong( this._currentSongId );

		if (currentSong) songPause();

		this._currentSongId = -1;
		window.currentPlaylist = null;
		this._isCurrentPlaylist = false;
	}

	/*
	 Play previous song
	 */
	_playPrev() {
		if (!this._isCurrentPlaylist) return 0;

		let prevSongIndex = null;

		this._list.find( (item, index) => { // finding current song index in the _list array
			if ( item.getProperty('id') == this._currentSongId ) {
				prevSongIndex = index - 1;
				return true;
			}
		} );

		if ( prevSongIndex === null ) return 0;
		if ( prevSongIndex < 0 ) {
			return 0;
		}

		prevSongIndex = this._list[prevSongIndex].getProperty('id');

		this.doAction( 'songChange', prevSongIndex, true );
	}

	/*
	 play next song
	 */
	_playNext() {
		if (!this._isCurrentPlaylist) return 0;

		let nextSongIndex = null;

		this._list.find( (item, index) => { // finding current song index in the _list array
			if ( item.getProperty('id') == this._currentSongId ) {
				nextSongIndex = index + 1;
				return true;
			}
		} );

		if ( nextSongIndex === null ) return 0;
		if ( nextSongIndex >= this._list.length ) {
			if ( this._repeats ) nextSongIndex = 0;
			else return 0;
		}

		nextSongIndex = this._list[nextSongIndex].getProperty('id'); // getting next song id

		this.doAction( 'songChange', nextSongIndex, true );
	}

	/*
	 shuffle playlist
	 */
	_shuffle() {
		for (let i = this._list.length - 1; i > 0; i--) { // shuffle songs list
		    let j = Math.floor(Math.random() * (i + 1));
		    [this._list[i], this._list[j]] = [this._list[j], this._list[i]];
		}

		this.render(); // render mixed list
	}

	/*
	 render this playlist
	 */
	render() {
		window.playlistHTML.innerHTML = '';

		let playlistItemLayout = getLayout('playlistItem');

		let songActionButton; // A button that determines whether we can remove or add a song

		if ( this._name == 'search' ) { // if we are searching songs, add 'add' button to each song
			songActionButton = '<div class="item__cross-btn float-r"> <img src="assets/icons/add.svg" data-pl-field="add"> </div>';
		} else { // if we are not, add 'remove' button to each song so user can delete them
			songActionButton = '<div class="item__cross-btn float-r"> <img src="assets/icons/add.svg" data-pl-field="remove"> </div>';
		}

		window.playlistHTML.setAttribute( 'data-playlist', this._name);

		for(let song of this) {
			let playlistItem = playlistItemLayout;

			window.playlistHTML.insertAdjacentHTML('beforeend', playlistItem);

			playlistItem = playlistHTML.querySelector('div[data-id="new"]');

			playlistItem.setAttribute( 'data-id', song.getProperty('id') );

			if ( song.getProperty('id') == this._currentSongId ) {
				playlistItem.setAttribute( 'data-playing', '');

				if ( !window.audio.paused ) {
					playlistItem.querySelector('img[data-pl-field="svg-play"]').src = 'assets/icons/pause-playlist.svg';
				}
			}

			let name = song.getProperty('name');
			name = name.length > 40 ? name.slice(0, 39) + '&hellip;' : name;

			let author = song.getProperty('author');
			author = author.length > 40 ? author.slice(0, 39) + '&hellip;' : author;

			playlistItem.querySelector('[data-pl-field="main-img"]').src = '/assets/icons/song-img.png';
			// innerHTML because of mnemonics are allowed
			playlistItem.querySelector('[data-pl-field="name"]').innerHTML = name;
			playlistItem.querySelector('[data-pl-field="author"]').innerHTML = author;

			playlistItem.querySelector('[data-pl-field="duration"]').textContent = convertTime( song.getProperty('duration') );

			playlistItem.insertAdjacentHTML('beforeend', songActionButton);
		}
	}

	// Playlist iterator of songs
	[Symbol.iterator]() {
		return {
			current: 0,
			to: this._list.length,
			list: this._list,

			next() {
				if (this.current < this.to) {
					return {done: false, value: this.list[this.current++]};
				} else return {done: true};
			}
		}
	}
}
"use strict";

let primaryPlaylist = new Playlist('main'); // the main playlist
primaryPlaylist.doAction('setPlaylistAsCurrent');

getCurrentUserSongs()
	.then(function(userSongs) {
		if (!userSongs) return 0;

		primaryPlaylist.doAction('songsAdd', userSongs);
		primaryPlaylist.render();
	});

let searchPlaylist = new Playlist('search'); // the playlist using for searching songs

/*
 Converts seconds to minutes e.g. 247 seconds to 04:07
 */
function convertTime(sec) {
	let minutes = Math.floor(sec/60);
	let seconds = Math.floor(sec - minutes*60);

	return ( minutes < 10 ? '0' + minutes : minutes ) + ':' + ( seconds < 10 ? '0' + seconds : seconds );
}

// called when the user is logged in
window.addEventListener('user-authorized', function() {
	// adds current user songs to primary playlist
	getCurrentUserSongs()
		.then(function(userSongs) {
			if (!userSongs) return;
			primaryPlaylist.doAction('songsAdd', userSongs);
			primaryPlaylist.render();
	    });
});

// handle click on a song in a playlist
window.playlistHTML.addEventListener('click', function(e) {
	let playlistItem = e.target.closest('.playlist-ul__item');
	if ( !playlistItem ) return 0;

	// here we add song to the primary playlist(if the click was on "plus" button)
	if ( e.target.dataset.plField == 'add' ) {
		let newSongObject = searchPlaylist.doAction('getSong', playlistItem.dataset.id);

		if (!newSongObject) return;

		newSongObject.setProperty('newSong', true);

		if ( primaryPlaylist.doAction('songAdd', newSongObject) !== false ) {
			e.target.style.transition = '2s all ease';
			e.target.style.transform = 'rotate(360deg)';

			setTimeout( () => e.target.remove(), 2150);
		}

		return 0;
	}

	// here we remove song from the primary playlist(if the click was on "remove" button)
	if ( e.target.dataset.plField == 'remove' ) {
		primaryPlaylist.doAction('songRemove', playlistItem.dataset.id); // remove a song from primary playlist
		return 0;
	}

	// changing current playlist
	if ( window.playlistHTML.dataset.playlist != window.currentPlaylist.doAction('getPlName') ) {
		if ( window.playlistHTML.dataset.playlist == 'main' ) {
			primaryPlaylist.doAction('setPlaylistAsCurrent');
			searchPlaylist.doAction('clearPlaylist');
		} else {
			searchPlaylist.doAction('setPlaylistAsCurrent');
		}
	}

	window.currentPlaylist.doAction('songChange', playlistItem.dataset.id, true);
});

// on search event
function onSearchDo() {
	window.playlistHTML.innerHTML = '<div class="playlist-ul__loading-img-wrap"><img class="playlist-ul__loading-img" src="/assets/icons/loading.svg"></div>';

	let searchQuery = window.playerHTML.querySelector('input[data-player-field="searchString"]').value;

	searchPlaylist.doAction('clearPlaylist');

	if ( searchQuery.trim() == '') {
		window.playlistHTML.innerHTML = '<div class="playlist-ul__empty-msg">Warning: search string is empty</div>';
		return;
	}

	searchSongs(searchQuery)
		.then(function(foundSongs) {
			if ( foundSongs == false ) {
				window.playlistHTML.innerHTML = '<div class="playlist-ul__empty-msg">no results were found for "' + searchQuery + '" =<</div>';
				return 0;
			}

			searchPlaylist.doAction('songsAdd', foundSongs); // now the searchPlaylist is current playlist
			searchPlaylist.render();
		});
}

// handling click on the player buttons
window.playerHTML.querySelector('.primary-controls__buttons').addEventListener('click', function(e) {
	if (!e.target.dataset.playerField) return 0;

	// if click on the "add" button, show search form
	if (e.target.dataset.playerField == 'add') {
		window.playerHTML.querySelector('[data-player-field="misc-btns"]').classList.add('hidden');

		window.playerHTML.querySelector('.primary-controls__buttons').insertAdjacentHTML('beforeend', getLayout('searchForm'));

		let searchInput = this.querySelector('[data-player-field="searchString"]');

		searchInput.onkeydown = function(e) {
	        if (e.key == 'Enter') {
	        	onSearchDo();
	        }
		};
	}

	// if click on the "backToPl" button of search form, return to primary playlist
	if (e.target.dataset.playerField == 'backToPL') {
		window.playerHTML.querySelector('[data-player-field="misc-btns"]').classList.remove('hidden');

		window.playerHTML.querySelector('[data-player-field="search-form"]').remove();

		primaryPlaylist.render();

		document.onkeydown = null;

		return 0;
	}

	// if click on the "searchDo" button of search form, show found songs
	if (e.target.dataset.playerField == 'searchDo') {
		onSearchDo();
		return 0;
	}

	// mute/unmute
	if ( e.target.dataset.playerField == 'volume' ) {
		if ( window.audio.muted ) {
			changeVolume('unmute');
		    e.target.src = 'assets/icons/volume.svg';

		    let seekValue = window.audio.volume * 100 + '%';

		   	e.target.parentNode.querySelector('[data-player-field="volumeChanger"]').querySelector('[data-seek]').style.height = seekValue;

		    return 0;
		}

		if ( !window.audio.muted ) {
			changeVolume(0);
		   	e.target.src = 'assets/icons/mute.svg';

		   	e.target.parentNode.querySelector('[data-player-field="volumeChanger"]').querySelector('[data-seek]').style.height = '0%';

		    return 0;
		}
	}

	if ( e.target.dataset.playerField == 'play' ) songPlay();
	else if ( e.target.dataset.playerField == 'pause' ) songPause();

	window.currentPlaylist.doAction( e.target.dataset.playerField );
});

// is Volume drag'n'drop in use
let doesVolumeChange = false;

// show volume changer when mouse is on the volume button
window.playerHTML.querySelector('[data-player-field="volume"]').addEventListener('mouseenter', function(e) {
	let volumeChanger = e.target.parentNode.querySelector('[data-player-field="volumeChanger"]');

	volumeChanger.style.display = 'block';

	let top = (this.getBoundingClientRect().top - this.parentNode.getBoundingClientRect().top) - volumeChanger.offsetHeight;
	let left = (this.getBoundingClientRect().left - this.parentNode.getBoundingClientRect().left);

	volumeChanger.style.top = top - 10 + 'px';
	volumeChanger.style.left = left + volumeChanger.offsetWidth / 2 + 'px';

	let volumeChangerInterval;

	function onMouseLeave(e) {
		if (doesVolumeChange) return 0;

		volumeChangerInterval = setTimeout(
				() => e.target.parentNode.querySelector('[data-player-field="volumeChanger"]').style.display = 'none',
			 150 );
	}

	e.target.onmouseleave = onMouseLeave;
	volumeChanger.onmouseleave = onMouseLeave;

	volumeChanger.onmouseenter = () => clearTimeout(volumeChangerInterval);
	this.addEventListener('mouseenter', () => clearTimeout(volumeChangerInterval));
});

// changing volume
window.playerHTML.querySelector('[data-player-field="volumeChanger"]').onmousedown = function(e) {
	let volumeChanger = this;
	let volumeSeek = volumeChanger.querySelector('[data-seek]');

	doesVolumeChange = true;

	document.body.onmousedown = () => false; // prevent selecting

	onMouseMove(e);

	function onMouseMove(e) {
		let newTop = -(e.clientY - volumeChanger.getBoundingClientRect().top) + volumeChanger.offsetHeight;
		let topEdge = volumeChanger.offsetHeight;

		if (newTop < 0) newTop = 0;
		if (newTop > topEdge) newTop = topEdge;

		let volumePercentage = newTop * 100 / topEdge

		volumeSeek.style.height = volumePercentage + '%';

		changeVolume( volumePercentage / 100 );

		if (volumePercentage == 0) {
			volumeChanger.parentNode.querySelector('[data-player-field="volume"]').src = 'assets/icons/mute.svg';
		} else {
			volumeChanger.parentNode.querySelector('[data-player-field="volume"]').src = 'assets/icons/volume.svg';
		}
	}

	document.addEventListener('mousemove', onMouseMove);
	document.addEventListener( 'mouseup', function(e) {
		document.removeEventListener('mousemove', onMouseMove);
		document.body.onmousedown = null; // allow selecting

		doesVolumeChange = false;

		let elUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
		let volumeBtn = window.playerHTML.querySelector('[data-player-field="volume"]');

		if ( elUnderMouse == volumeChanger ) return 0;
		if ( elUnderMouse == volumeSeek ) return 0;
		if ( elUnderMouse == volumeBtn ) return 0;

		volumeChanger.parentNode.querySelector('[data-player-field="volumeChanger"]').style.display = 'none';
	});
};

// this function allow user to rewind a song
window.playerHTML.querySelector('[data-progress-bar]').onmousedown = function(e) {
	if (window.audio.currentTime == 0) return 0;

	document.body.onmousedown = () => false; // prevent selecting

	let progressBar = this;
	let progressBarSeek = progressBar.querySelector('[data-seek]');

	progressBar.setAttribute('data-changing', '');

	let newTime; // rewind to this time

	onMouseMove(e);

	function onMouseMove(e) {
		let newLeft = e.clientX - progressBar.getBoundingClientRect().left;
		let rightEdge = progressBar.offsetWidth;

		if (newLeft < 0) newLeft = 0;
		if (newLeft > rightEdge) newLeft = rightEdge;

		let percentage = newLeft * 100 / rightEdge;

		progressBarSeek.style.width = percentage + '%';

		newTime = window.audio.duration * percentage / 100;
	}

	document.addEventListener('mousemove', onMouseMove);
	document.addEventListener('mouseup', function onMouseUp() {
		document.removeEventListener('mousemove', onMouseMove);
		progressBar.removeAttribute('data-changing');

		window.audio.currentTime = newTime; // when mouse up rewind to this time
		seekUpdate(newTime);

		document.body.onmousedown = null; // allow selecting

		document.removeEventListener('mouseup', onMouseUp);
	});
};

// do songs already load
let songsLoading = false;

// loads songs when the user scrolls to bottom or top
function loadSongsOnScroll(e) {
	let toLoad = ( e.target.scrollHeight - (e.target.scrollTop + e.target.offsetHeight) ) <= 100;

	if ( toLoad && !songsLoading ) {

		songsLoading = true;

		if ( window.playlistHTML.dataset.playlist == 'main' ) {
			getCurrentUserSongs()
				.then(function(userSongs) {
					if ( userSongs == false ) return 0;

					primaryPlaylist.doAction('songsAdd', userSongs);
					primaryPlaylist.render();
				})
				.then( () => songsLoading = false );
		} else if ( window.playlistHTML.dataset.playlist == 'search' ) {
			searchSongs(false)
				.then(function(foundSongs) {
					if ( foundSongs == false ) return 0;

					searchPlaylist.doAction('songsAdd', foundSongs); // now the searchPlaylist is current playlist
					searchPlaylist.render();
				})
				.then( () => songsLoading = false );
		}
	}
}

window.playlistHTML.onscroll = loadSongsOnScroll;

function sendNewUserSongs() {
	let userSongs = primaryPlaylist.getNewUserSongs();

	if ( userSongs.length == 0 ) return;

	// remove fields from songs to reduce the size
	userSongs.forEach(function(item, index, array) {
	  delete array[index]._id;
	  delete array[index]._newSong;
	  delete array[index]._songURL;
	});

	navigator.sendBeacon("/?save=1", JSON.stringify(userSongs));
}

window.addEventListener('unload', sendNewUserSongs);

// flush to delete songs buffer
window.addEventListener('unload', function() {
	let songsToDelete = primaryPlaylist.getDeleteSongsBuffer();

	if ( songsToDelete.length == 0 ) return;

	navigator.sendBeacon("/?delete=1", JSON.stringify(songsToDelete));
});
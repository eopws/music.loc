"use strict";

/*
 Makes a request to the server with search query(song name or author or  all in one)
 If called with searchString == false requests additional songs for the search string(lazy load)
*/
async function searchSongs(searchString) {
    let body;

    if ( searchString === false ) {
        body = 'searchRequestAdditional=true';
    } else body = `search=${searchString}`;

    if ( searchString.trim() == '' ) return false;

	let searchQuery = await fetch('http://music.loc/', {
        method: 'POST',

        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        },

        body
    });

    let serverRespond = await searchQuery.text();

    if ( serverRespond == '404' ) return false;

    let foundSongs = JSON.parse( serverRespond );

    let foundSongsObjects = [];

    for (let song of foundSongs) {
        foundSongsObjects.push( new Song( song.songURL, song.name, song.author, song.duration, song.z_url) );
    }

    return foundSongsObjects;
}

/*
 Returns an array of songs related to current user
 */
async function getCurrentUserSongs() {
    let body = 'getUserSongs=true';

    let getCurrentUserSongsQuery = await fetch('http://music.loc/', {
        method: 'POST',

        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },

        body
    }); 

    let serverRespond = await getCurrentUserSongsQuery.text();

    // no songs found
    if ( serverRespond === 'false' ) return 0;

    let userSongs = JSON.parse(serverRespond);

    if ( Object.keys( userSongs ).length == 0 ) return false;

    let userSongsObjects = [];

    for (let song of userSongs) {
        userSongsObjects.push( new Song(song.songURL, song.name, song.author, song.duration, song.z_url) );
    }

    return userSongsObjects;
}

/*
 * Sends request to server with query to delete user songs
 * Returns nothing
 */
async function deleteUserSongs(songs) {
    let response = await fetch('/?delete=1', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },

      body: JSON.stringify(songs)
    });
}

/*
 Gives layout of smth. Made for easy layout changing
 */
function getLayout(ofWhat) {
	switch(ofWhat) {
        // layout of song in playlist
        case 'playlistItem':
    		return `<div data-id="new" class="playlist-ul__item">
                    <div class="item__img-wrapper float-l">
                        <img data-pl-field="main-img" class="item__main-img">
                        <img data-pl-field="svg-play" class="item__svg-play" src="assets/icons/play-playlist.svg">
                    </div>

                    <div class="title-song --playlist float-l">
                        <span data-pl-field="name" class="title-song__name --small"></span>
                        <span data-pl-field="author" class="title-song__author"></span>
                    </div>

                    <span data-pl-field="duration" class="item__time float-r"></span>
                </div>`;
        break;

        // form for searching songs
        case 'searchForm':
            return `<div data-player-field="search-form" class="float-r buttons__search-form">
                        <input class="search-form__input" style="background-image: url(/assets/icons/back.svg);" data-player-field="backToPL" type="submit" value=""><!--
                     --><input class="search-form__input" data-player-field="searchString" type="text"><!--
                     --><input class="search-form__input" style="background-image: url(/assets/icons/search.svg);" data-player-field="searchDo" type="submit" value="">
                    </div>`;
        break;

        // shuffle, repeat, volume... buttons
        case 'miscPlayerBtns':
            return `<div data-player-field="misc-btns" class="float-r">
                            <div class="buttons__btn">
                                <img data-player-field="shuffle" class="shuffle" src="assets/icons/shuffle.svg" alt="not supported">
                            </div><!--
                         --><div class="buttons__btn">
                                <img data-player-field="repeatAll" class="repeat" src="assets/icons/repeat.svg" alt="not supported">
                            </div><!--
                         --><div class="buttons__btn">
                                <img data-player-field="volume" class="volume" src="assets/icons/volume.svg" alt="not supported">
                            </div><!--
                         --><div class="buttons__btn">
                                <img data-player-field="add" class="add" src="assets/icons/add.svg" alt="not supported">
                            </div>
                    </div>`;
        break;
    }
}
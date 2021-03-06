import { browserHistory } from 'react-router';
import jwt from 'jsonwebtoken';
import SC from 'soundcloud';
import BaseURI from '../common/BaseURI';

export const LOADING_SEARCH = 'LOADING_SEARCH';
export const LOADING_STATION = 'LOADING_STATION';
export const SET_STATION = 'SET_STATION';
export const SET_ADMIN = 'SET_ADMIN';
export const SET_WEBSOCKET = 'SET_WEBSOCKET';
export const UPDATE_PLAYER = 'UPDATE_PLAYER';
export const SET_SEARCH_VALUE = 'SET_SEARCH_VALUE';
export const SET_SOUNDCLOUD_SONGS = 'SET_SOUNDCLOUD_SONGS';
export const SET_APPLE_MUSIC_SONGS = 'SET_APPLE_MUSIC_SONGS';
export const SET_SPOTIFY_SONGS = 'SET_SPOTIFY_SONGS';
export const STATION_ERROR = 'STATION_ERROR';
export const SPOTIFY_ERROR = 'SPOTIFY_ERROR';
export const SOUNDCLOUD_ERROR = 'SOUNDCLOUD_ERROR';
export const APPLEMUSIC_ERROR = 'APPLEMUSIC_ERROR';
export const SEND_NOTIFICATION = 'SEND_NOTIFICATION';
export const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';


//////////////////////////////////////////////////////////////////////////////
//
// Initialization
//
//////////////////////////////////////////////////////////////////////////////

let appleMusicToken;

jwt.sign({ iss: '2EXVDJ88N2' }, '-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgIid3+wnYhhPXSvrjH7BO1o7KgacJpVIYIrufxmiKSgCgCgYIKoZIzj0DAQehRANCAARCdYFP5H8z7/Z9JOBk+aNzxxuxnqmNz/l2wGpaUo8Zu//W3DYR+x6nALb23XpSDHl/2mAqMuKzUOqaxOO3Axeu\n-----END PRIVATE KEY-----', { algorithm: 'ES256', keyid: 'SMJSB9AGUQ', expiresIn: '10000000' }, (err, token) => {
    appleMusicToken = token;
});

document.addEventListener('DOMContentLoaded', () => {
    return fetch(`http://${BaseURI}/api/token`, {
        method: 'GET',
        mode: 'cors',
    })
    .then((res) => {
        res.json().then((json) => {
            if (res.ok) {
                // appleMusicToken = json.token;
                MusicKit.configure({
                    developerToken: appleMusicToken,
                });
            } else {

            }
        });
    })
    .catch((err) => {

    });
});

const dev = true;
SC.initialize({
    client_id: dev ? 'oG45iJyWRj8McdpinDKk4QSgRm8C1VzL' : 'GwGiygexslzpWR05lHIGqMBPPN0blbni',
});



let ws;
//////////////////////////////////////////////////////////////////////////////
//
// Redux Actions
//
//////////////////////////////////////////////////////////////////////////////

function loadingStation() {
    return {
        type: LOADING_STATION,
    };
}

function loadingSearch() {
    return {
        type: LOADING_SEARCH,
    };
}

function setStation(station) {
    return {
        type: SET_STATION,
        payload: {
            station,
        },
    };
}

function setAdmin(admin) {
    return {
        type: SET_ADMIN,
        payload: {
            admin,
        },
    };
}

function setWebsocket(ws) {
    return {
        type: SET_WEBSOCKET,
        payload: {
            ws,
        },
    };
}

function setSearchValue(query) {
    return {
        type: SET_SEARCH_VALUE,
        payload: {
            query,
        },
    };
}

function setSoundCloudSongs(songs, query) {
    return {
        type: SET_SOUNDCLOUD_SONGS,
        payload: {
            songs,
            query,
        },
    };
}

function setAppleMusicSongs(songs, query) {
    return {
        type: SET_APPLE_MUSIC_SONGS,
        payload: {
            songs,
            query,
        },
    };
}

function setSpotifySongs(songs, query) {
    return {
        type: SET_SPOTIFY_SONGS,
        payload: {
            songs,
            query,
        },
    };
}

function stationError(error) {
    return {
        type: STATION_ERROR,
        payload: {
            error,
        },
    };
}

function spotifyError(error) {
    return {
        type: SPOTIFY_ERROR,
        payload: {
            error,
        },
    };
}

function soundcloudError(error) {
    return {
        type: SOUNDCLOUD_ERROR,
        payload: {
            error,
        },
    };
}

function appleMusicError(error) {
    return {
        type: APPLEMUSIC_ERROR,
        payload: {
            error,
        },
    };
}

function notification(header, message) {
    return {
        type: SEND_NOTIFICATION,
        payload: {
            header,
            message,
        },
    };
}

export function removeNotification(id) {
    return {
        type: REMOVE_NOTIFICATION,
        payload: {
            id,
        },
    };
}

function updatePlayer(currentSong) {
    return {
        type: UPDATE_PLAYER,
        payload: {
            currentSong,
        },
    };
}

//////////////////////////////////////////////////////////////////////////////
//
// Websocket Actions
//
//////////////////////////////////////////////////////////////////////////////

export function sendPlayer(currentSong) {
    ws.send(
        JSON.stringify({
            ...currentSong,
        }),
    );
}

function openSocket(stationRoute, username, dispatch) {
    ws = new WebSocket(`ws://${BaseURI}/api${stationRoute}/ws/${username}`);
    window.onbeforeunload = () => {
        ws.close();
    };
    dispatch(setWebsocket(ws));
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(data);
        if (data.station) {
            dispatch(setStation(data.station));
            dispatch(notification(data.header, data.message));
            // dispatch(updatePlayer(data.station.playing));
        }
        // if (data.header === "Next Song") {
            // dispatch(updatePlayer(data.station.playing));
        // }
        // if (data.player) {
        //     dispatch(updatePlayer(data.player));
        // }
        dispatch(setAdmin(data.admin));
    };
}


export function resetStation(username, stationName) {
    return (dispatch) => {
        return fetch(`http://${BaseURI}/api${username}/reset`, {
            method: 'GET',
            mode: 'cors',
        })
        .then((res) => {
            return res.json().then((json) => {
                if (res.ok) {
                    browserHistory.push(`/${username}/${json.station.name}`);
                } else {
                    const error = {
                        status: res.status,
                        type: json.error_type,
                        message: json.error_message,
                    };
                    dispatch(stationError(error));
                }
            });
        })
        .catch((err) => {
            setTimeout(() => dispatch(stationError({ status: 500, type: 'Internal server error', message: err })), 1000);
        });
    };
}

//////////////////////////////////////////////////////////////////////////////
//
// Database API Actions
//
//////////////////////////////////////////////////////////////////////////////


export function shuffleStation() {
    const stationRoute = browserHistory.getCurrentLocation().pathname;
    return (dispatch) => {
        dispatch(loadingStation());
        return fetch(`http://${BaseURI}/api${stationRoute}/shuffle`, {
            method: 'GET',
            mode: 'cors',
        })
        .then((res) => {
            return res.json().then((json) => {
                if (res.ok) {
                    // console.log(json);
                    // dispatch(setStation(json.station));
                } else {
                    const error = {
                        status: res.status,
                        type: json.error_type,
                        message: json.error_message,
                    };
                    dispatch(stationError(error));
                }
            });
        })
        .catch((err) => {
            setTimeout(() => dispatch(stationError({ status: 500, type: 'Internal server error', message: err })), 1000);
        });
    };
}

export function nextSong() {
    const stationRoute = browserHistory.getCurrentLocation().pathname;
    return (dispatch) => {
        dispatch(loadingStation());
        return fetch(`http://${BaseURI}/api${stationRoute}/play/next`, {
            method: 'POST',
            mode: 'cors',
        })
        .then((res) => {
            return res.json().then((json) => {
                if (res.ok) {
                    // sendPlayer(json.station.playing);
                } else {
                    const error = {
                        status: res.status,
                        type: json.error_type,
                        message: json.error_message,
                    };
                    dispatch(stationError(error));
                }
            });
        })
        .catch((err) => {
            setTimeout(() => dispatch(stationError({ status: 500, type: 'Internal server error', message: err })), 1000);
        });
    };
}


export function addSong(songRequest) {
    const stationRoute = browserHistory.getCurrentLocation().pathname;
    return (dispatch) => {
        dispatch(loadingStation());
        return fetch(`http://${BaseURI}/api${stationRoute}/songs/add`, {
            method: 'POST',
            body: JSON.stringify(songRequest),
            mode: 'cors',
        })
        .then((res) => {
            return res.json().then((json) => {
                if (res.ok) {
                    // console.log(json);
                    // dispatch(setStation(json.station));
                } else {
                    const error = {
                        status: res.status,
                        type: json.error_type,
                        message: json.error_message,
                    };
                    dispatch(stationError(error));
                }
            });
        })
        .catch((err) => {
            setTimeout(() => dispatch(stationError({ status: 500, type: 'Internal server error', message: err })), 1000);
        });
    };
}

export function sendVote(voteRequest) {
    const stationRoute = browserHistory.getCurrentLocation().pathname;
    return (dispatch) => {
        dispatch(loadingStation());
        return fetch(`http://${BaseURI}/api${stationRoute}/songs/vote`, {
            method: 'POST',
            body: JSON.stringify(voteRequest),
            mode: 'cors',
        })
        .then((res) => {
            return res.json().then((json) => {
                if (res.ok) {
                    // console.log(json);
                    // dispatch(setStation(json.station));
                } else {
                    const error = {
                        status: res.status,
                        type: json.error_type,
                        message: json.error_message,
                    };
                    dispatch(stationError(error));
                }
            });
        })
        .catch((err) => {
            setTimeout(() => dispatch(stationError({ status: 500, type: 'Internal server error', message: err })), 1000);
        });
    };
}


export function getStation(stationRoute, username) {
    return (dispatch) => {
        openSocket(stationRoute, username, dispatch);
    };
}

export function changeDevice(deviceId, token) {
    return fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            device_ids: [deviceId],
            play: false,
        }),
    });
}


//////////////////////////////////////////////////////////////////////////////
//
// Search
//
//////////////////////////////////////////////////////////////////////////////


export function searchSpotify(query, spotifyToken) {
    return (dispatch) => {
        return fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=15`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${spotifyToken}`,
            },
        })
        .then((res) => {
            return res.json().then((json) => {
                console.log(json);
                if (res.status === 200) {
                    if (!json.tracks.items) {
                        return dispatch(setSpotifySongs([], ''));
                    }
                    const songs = json.tracks.items.map((song) => {
                        return {
                            song_id: `${song.id}`,
                            title: song.name,
                            artist: song.artists[0].name,
                            album_url: song.album.images[0].url,
                            duration: song.duration_ms,
                        };
                    });
                    return dispatch(setSpotifySongs(songs, query));
                }
                const error = {
                    status: json.error.status,
                    type: json.error.status,
                    message: json.error.message,
                };
                return dispatch(spotifyError(error));
            });
        })
        .catch((err) => {
            setTimeout(() => dispatch(spotifyError({ status: 500, type: 'Internal server error', message: err })), 1000);
        });
    };
}

export function searchSoundcloud(query) {
    return (dispatch) => {
        if (query === '') {
            return dispatch(setSoundCloudSongs([], ''));
        }
        return SC.get('/tracks', {
            q: query,
        })
        .then((res) => {
            if (res) {
                const songs = res.map((song) => {
                    return {
                        song_id: `${song.id}`,
                        title: song.title,
                        artist: song.user.username,
                        album_url: song.artwork_url,
                        duration: song.duration,
                    };
                });
                dispatch(setSoundCloudSongs(songs, query));
            } else {
                const error = {
                    status: res.status,
                    type: json.error_type,
                    message: json.error_message,
                };
                dispatch(soundcloudError(error));
            }
        })
        .catch((err) => {
            setTimeout(() => dispatch(soundcloudError({ status: 500, type: 'Internal server error', message: err })), 1000);
        });
    };
}

export function searchAppleMusic(query) {
    let music = MusicKit.getInstance();
    const term = query.replace(/ /g, '+');
    console.log(appleMusicToken);
    return (dispatch) => {
        // return fetch(`https://api.music.apple.com/v1/catalog/us/search?term=${term}?&types=artists,songs&limit=15`, {
        //     method: 'GET',
        //     headers: {
        //         Authorization: `Bearer ${appleMusicToken}`,
        //     },
        //     mode: 'cors',
        // })
        music.api.search(term, {types: "artists,songs", limit: 15})
        .then((res) => {
            return res.json().then((json) => {
                if (res.ok) {
                    if (!json.results.songs) {
                        return dispatch(setAppleMusicSongs([], ''));
                    }
                    const songs = json.results.songs.data.map((song) => {
                        let albumUrl = song.attributes.artwork.url.replace(/{w}/g, Math.floor(song.attributes.artwork.width / 10));
                        albumUrl = albumUrl.replace(/{h}/g, Math.floor(song.attributes.artwork.height / 10));
                        return {
                            song_id: `${song.id}`,
                            title: song.attributes.name,
                            artist: song.attributes.artistName,
                            album_url: albumUrl,
                            duration: song.attributes.durationInMillis,
                        };
                    });
                    return dispatch(setAppleMusicSongs(songs, query));
                }
                const error = {
                    status: res.status,
                    type: json.error_type,
                    message: json.error_message,
                };
                return dispatch(appleMusicError()(error));
            });
        })
        .catch((err) => {
            setTimeout(() => dispatch(appleMusicError({ status: 500, type: 'Internal server error', message: err })), 1000);
        });
    };
}

export function searchAll(query, soundcloud, spotify, applemusic, spotifyToken) {
    return (dispatch) => {
        dispatch(setSearchValue(query));
        if (query === '') {
            return;
        }
        // TODO have search to wait for all to load to display at once?
        dispatch(loadingSearch());
        if (soundcloud) {
            dispatch(searchSoundcloud(query));
        }
        if (spotify) {
            dispatch(searchSpotify(query, spotifyToken));
        }
        if (applemusic) {
            dispatch(searchAppleMusic(query));
        }
    };
}

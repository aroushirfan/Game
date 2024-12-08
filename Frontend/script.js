'use strict';
const apiUrl= 'http://127.0.0.1:5000/';
let playerState= JSON.parse(localStorage.getItem('playerState'));

if (playerState) {
    document.querySelector('#money').innerHTML= playerState.money;
    document.querySelector('#range').innerHTML= playerState.range;
    document.querySelector('#time').innerHTML= playerState.time;
    document.querySelector('#health').innerHTML= playerState.health;
    console.log('Game initialized', playerState);
}
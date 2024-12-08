'use strict';
const apiUrl= 'http://127.0.0.1:5000/';
let playerState={};

document.querySelector('#startGame').addEventListener('submit', async function (evt) {
    evt.preventDefault();
    const playerName= document.querySelector('#playerName').value;

    const airportsResponse= await fetch(`${apiUrl}fetch_airports`);
    const data= await airportsResponse.json();
    const airports= data.airports;

    if (airports.length===0) {
        alert('No airports available');
        return;
    }

    const startingAirport= airports[Math.floor(Math.random()*airports.length)].ident

    const createPlayerResponse= await fetch (`${apiUrl}create_player`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            p_name: playerName,
            start_money: 20000,
            start_range: 5000,
            start_time: 900,
            current_airport: startingAirport,
            health: 100,
            airports: airports,
        }),
    });
    const gameState= await createPlayerResponse.json();
    if (!gameState.player_id) {
        alert("Sorry! Error in starting the game.")
        return;
    }
    playerState= {
        id: gameState.player_id,
        money: 20000,
        range: 5000,
        time: 900,
        health: 100,
        current_airport: startingAirport,
        total_airports: airports
    };

    localStorage.setItem('playerState', JSON.stringify(playerState));
    window.location.href='index.html'

})
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

async function displayMap() {
    const weatherResponse = await fetch(`${apiUrl}get_weather_for_airports`);
    const weatherData = await weatherResponse.json();
    const airportsWeather = weatherData.airport_weather;

    const domainResponse= await fetch (`${apiUrl}airports_in_domain`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify ({
            icao_code: playerState.current_airport,
            player_range: playerState.range,
            airports: airportsWeather

        }),

    });

    const domainData= await domainResponse.json();
    const domainAirports= domainData.airports_in_domain;


    const startingAirport= domainAirports.find(airport => airport.ident === playerState.current_airport);

    const map = L.map('map').setView([startingAirport.latitude_deg, startingAirport.longitude_deg], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    let startingMarker;

    for (let i = 0; i <domainAirports.length; i++) {
        const airport = domainAirports[i];
        const weatherInfo = airport.weather ? `Weather: ${airport.weather.description}, Temperature: ${airport.weather.temperature}°C` : 'Weather data unavaialble';
        const weatherIcon = airport.weather ? `http://openweathermap.org/img/wn/${airport.weather.icon}.png` : '';
        const markerContent = `
        <b>${airport.airport_name}</b><br>
        ICAO code: ${airport.ident}<br>
        ${weatherInfo}<br>
        <img src="${weatherIcon}" alt="Weather Icon"><br>
        <button onclick="flyHere('${airport.ident}')">Fly Here</button>
        `;
        const marker= L.marker([airport.latitude_deg, airport.longitude_deg]).addTo(map);
        marker.bindPopup(markerContent);

        if (airport.ident === playerState.current_airport) {
            startingMarker = marker;
        }
    }
    if (startingMarker) {
        startingMarker.openPopup();
    }
}
displayMap();

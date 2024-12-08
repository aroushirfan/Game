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
    const airportsWithWeather = weatherData.airport_weather;

    const startingAirport= airportsWithWeather.find(airport => airport.ident === playerState.current_airport);

    const map = L.map('map').setView([startingAirport.latitude_deg, startingAirport.longitude_deg], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    let startingMarker;

    for (let i = 0; i <airportsWithWeather.length; i++) {
        const airport = airportsWithWeather[i];
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

async function flyHere(airportIdent, airportName) {

    const distanceResponse= await fetch (`${apiUrl}calculate_distance`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            current_airport: playerState.current_airport,
            target_airport: airportIdent,
        }),
    });

    const distanceData= await distanceResponse.json();
    const distance= distanceData.distance;

    if(distance>playerState.range) {
        document.querySelector('#updates').innerHTML= "You don't have enough range to fly here."
        return;
    }
    playerState.range-=distance;

    const response= await fetch(`${apiUrl}update_player`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            icao: airportIdent,
            player_id: playerState.id,
            player_range: playerState.range,
            player_money: playerState.money,
            player_time: playerState.time,
            player_health: playerState.health,
        }),
    });

    const data= await response.json();
    console.log('Player location is updated:', data);

    playerState.current_airport= airportIdent

    const timeResponse= await fetch (`${apiUrl}decrease_time`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            player_id: playerState.id,
        }),
    });
    const timeData= await timeResponse.json();
    playerState.time= timeData.new_time;

    const healthResponse= await fetch (`${apiUrl}decrease_health`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            player_id: playerState.id,
        }),
    });
    const healthData= await healthResponse.json();
    playerState.health= healthData.new_health;

    document.querySelector('#updates').innerHTML= `Congratulations! You have successfully flown to ${airportName}, ${airportIdent}. Range used: ${distance}.`;
    document.querySelector('#money').innerHTML= playerState.money;
    document.querySelector('#range').innerHTML= playerState.range;
    document.querySelector('#time').innerHTML= playerState.time;
    document.querySelector('#health').innerHTML= playerState.health;

    const targetsResponse= await fetch (`${apiUrl}check_targets`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            player_id: playerState.player_id,
            current_airport: airportIdent,
        }),
    });
    const targetsData= await targetsResponse.json();
    const targets= targetsData.targets;

    if (targets.length>0){
        let targetMessage= 'You have encountered the following target:';
        for (let target of targets) {
            if (target.name==='bomb') {
                targetMessage= 'Congratulations you changed the history! You have won the game.'
                break;
            } else {
                targetMessage +=`<br>${target.name} (Value: ${target.value})`;
            }
        }
        document.querySelector('#updates').innerHTML += `<br>${targetMessage}`;
    }

    displayMap();
}
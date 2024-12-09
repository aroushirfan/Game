'use strict';
const apiUrl= 'http://127.0.0.1:5000/';
let playerState= JSON.parse(localStorage.getItem('playerState'));

if (playerState) {
    updatePlayerUI();
    displayWeather(playerState.current_airport);
    console.log('Game initialized', playerState);
}

function updatePlayerUI () {
    document.querySelector('#money').innerHTML= playerState.money;
    document.querySelector('#range').innerHTML= playerState.range;
    document.querySelector('#time').innerHTML= playerState.time;
    document.querySelector('#health').innerHTML= playerState.health;
}

function createMarker (map, airport, isStarting) {
    const weatherInfo = airport.weather ? `Weather: ${airport.weather.description}, Temperature: ${airport.weather.temperature}°C` : 'Weather data unavailable';
        const weatherIcon = airport.weather ? `http://openweathermap.org/img/wn/${airport.weather.icon}.png` : '';
        const markerContent = `
        <b>${airport.airport_name}</b><br>
        ICAO code: ${airport.ident}<br>
        ${weatherInfo}<br>
        <img src="${weatherIcon}" alt="Weather Icon"><br>
        <button onclick="flyHere('${airport.ident}', '${airport.airport_name}')">Fly Here</button>
        `;
        const marker= L.marker([airport.latitude_deg, airport.longitude_deg]).addTo(map);
        marker.bindPopup(markerContent);

        if (isStarting) {
            marker.openPopup();
        }
        return marker;
}

async function displayMap() {
    try {
        const weatherResponse = await fetch(`${apiUrl}get_weather_for_airports`);
        const weatherData = await weatherResponse.json();
        const airportsWithWeather = weatherData.airport_weather;
        const startingAirport= airportsWithWeather.find(airport => airport.ident === playerState.current_airport);

        const map = L.map('map').setView([startingAirport.latitude_deg, startingAirport.longitude_deg], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        for (const airport of airportsWithWeather) {
            createMarker(map, airport, airport.ident===playerState.current_airport);
        }

    } catch (error) {
        console.log ('Error displaying in map', error);
    }
}

displayMap();

async function displayWeather (airportIdent) {
    try {
        const response = await fetch (`${apiUrl}get_weather_for_airports`);
        const weatherData= await response.json();
        const airportsWithWeather= weatherData.airport_weather;

        const currentAirport= airportsWithWeather.find (airport => airport.ident===airportIdent);
        if (currentAirport && currentAirport.weather) {
            const weather= currentAirport.weather;
            const weatherInfo= `
                <b>${currentAirport.airport_name}</b><br> 
                ${weather.description}<br>
                Temperature: ${weather.temperature}°C<br> 
                <img src="http://openweathermap.org/img/wn/${weather.icon}.png" alt="Icon">
            `;
            document.querySelector('#weather').innerHTML= weatherInfo;
        }
    } catch (error) {
        console.log('Error displaying weather', error);
    }
}

async function flyHere (airportIdent, airportName) {
    try {
        const response= await fetch (`${apiUrl}calculate_distance`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'},
            body: JSON.stringify({
                current_airport: playerState.current_airport,
                target_airport: airportIdent,
            }),
        });
        const distanceData= await response.json();
        const distance= distanceData.distance;
        if(distance>playerState.range) {
            document.querySelector('#updates').innerHTML= "You don't have enough range to fly here."
            return;
        }
        playerState.range-=distance;

        await updatePlayerState (airportIdent, distance, airportName);
    } catch (error) {
        console.log ('Error flying', error);
    }
}

async function updatePlayerState(airportIdent, distance, airportName) {
    try {
        await fetch(`${apiUrl}update_player`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'},
            body: JSON.stringify({
                icao: airportIdent,
                player_id: playerState.id,
                player_range: playerState.range,
                player_money: playerState.money,
                player_time: playerState.time,
                player_health: playerState.health,
            }),
        });
        playerState.current_airport= airportIdent

        const timeResponse= await fetch (`${apiUrl}decrease_time`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                player_id: playerState.id,
            }),
        });
        const healthData= await healthResponse.json();
        playerState.health= healthData.new_health;

        document.querySelector('#updates').innerHTML= `Congratulations! You have successfully flown to ${airportName}, ${airportIdent}. Range used: ${distance}.`;
        updatePlayerUI();
        await displayWeather(airportIdent);
        await checkTargets(airportIdent);
    } catch (error) {
        console.log('Error updating player state', error)
    }
}

async function checkTargets (airportIdent) {
    try {
        const response= await fetch (`${apiUrl}check_targets`,{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                player_id: playerState.id,
                current_airport: airportIdent,
            }),
        });
        const targetsData= await response.json();
        const targets= targetsData.targets;

        if (targets.length>0){
            let targetMessage= 'You have encountered the following target:';
            for (let target of targets) {
                if (target.name==='bomb') {
                    targetMessage= 'Congratulations you changed the history! You have won the game.'
                    break;
                } else {
                    const coupon= confirm (`${target.name} (Value: ${target.value}) found! Do you want to redeem it for money by using 50km range?`);
                    if (coupon && playerState.range>= 50) {
                        playerState.range-=50;
                        playerState.money+= target.value;
                        targetMessage+= `<br>${target.name} redeemed for ${target.value} rupees.`;
                    }
                    else {
                        targetMessage +=`<br>${target.name} not redeemed.`;
                    }

                }
            }
            document.querySelector('#updates').innerHTML += `<br>${targetMessage}`;
            updatePlayerUI();
        }
        await offerFuelPurchase();
        displayMap();

    } catch (error) {
        console.log ('Error in checking targets', error);
    }
}

async function offerFuelPurchase() {
    const buy= confirm ("Do you want to buy fuel (range) with money? 1 rupee = 1 km");
    if (buy) {
        const amount= parseInt(prompt("Enter the amount: "));
        if (amount !== null && amount<=playerState.money) {
            playerState.money-=amount;
            playerState.range+= amount;
            document.querySelector('#updates').innerHTML += `Range increased by ${amount} km.`;
            updatePlayerUI()
        } else {
            alert ('Invalid amount or insufficient funds.')
        }
    }
}

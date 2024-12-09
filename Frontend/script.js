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
displayMap();

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
        await offerFuelPurchase()
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
        updatePlayerUI();
        displayWeather(airportIdent);
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
        checkTargets(airportIdent);
        await buyFood();
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

function buyFood() {
    if (playerState.health<=40) {
        const purchase= confirm('Your health is low. Buy food for 100 rupees. It will give you maximum health.');
        if (purchase && playerState.money>=100) {
            playerState.money-=100;
            playerState.health= Math.min(playerState.health + 60, 100);
            document.querySelector('#updates').innerHTML+=`<br>Food purchased. Health increased by 50.`;
            updatePlayerUI();
        } else {
            alert('Insufficient funds to buy food.')
        }
    }
}

async function fetchRiddle() {
    try {
        const response= await fetch (`${apiUrl}fetch_riddles`);
        const data= await response.json();
        const riddle= data.riddle;
        document.querySelector('#content').innerHTML= `
            <b>Riddle:</b> ${riddle.riddle_text}<br>
            <input type="text" id="riddleAnswer" placeholder="You answer"><br>
            <button onclick="submitRiddleAnswer(${riddle.id})">Submit Answer</button>            
        `;

    } catch (error) {
        console.log('Error fetching riddle', error)
    }
}

async function submitRiddleAnswer (riddleId) {
    try {
        const answer= document.querySelector('#riddleAnswer').value;
        const response= await fetch (`${apiUrl}check_riddle_answers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                riddle_answers: { [riddleId]: answer}
            })

        });
        const data= await response.json();
        const correctAnswers= data.correct_answers;

        if (correctAnswers>0) {
            playerState.money += 600;
            document.querySelector('#riddles').innerHTML+= `Correct answer! You earned 600 rupees.`
        } else {
            document.querySelector('#riddles').innerHTML+= `Sorry incorrect answer!`
        }
    } catch (error) {
        console.log ('Error submitting riddle answer', error);
    }
}

async function fetchDifficultRiddle() {
    try {
        const response = await fetch(`${apiUrl}fetch_difficult_riddles`);
        const data = await response.json();
        const riddles = data.riddle;

        let riddleContent = '<b>Answer these riddles to get a hint.</b><br>'
        for (let i = 0; i < riddles.length; i++) {
            const riddle = riddles[i];
            riddleContent = `
                ${i + 1}.${riddle.riddle_text}<br>
                <input type="text" placeholder="You answer"><br>
                <input type="text" id="riddleAnswer${riddle.id}" placeholder="You answer"><br>
            `;
        }
        riddleContent += <button onClick="submitDifficultRiddleAnswer([${riddleIds.join(',')}])">Submit Answers</button>;
        document.querySelector('#content').innerHTML= riddleContent;
    } catch (error) {
        console.log('Error fetching riddle', error)
    }
}

async function submitDifficultRiddleAnswer (riddleIds) {
    try {
        const riddleAnswers= {};
        for (let i=0; i<riddleIds.length; i++) {
            const id= riddleIds[i];
            riddleAnswers[i]= document.querySelector('#riddleAnswer').value
        }

        const response= await fetch (`${apiUrl}check_riddle_answers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player_id: playerState.id,
                riddle_answers: riddleAnswers
            })
        });
        const data= await response.json();
        const hint= data.hint;
        document.querySelector('#riddles').innerHTML+= `<br>Hint: ${hint}`;
    } catch (error) {
        console.log ('Error submitting difficult riddle answers', error);
    }
}

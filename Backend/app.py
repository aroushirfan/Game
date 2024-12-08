from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from game import Game
from airport import Airport
from weather import Weather

app=Flask(__name__)
CORS(app)

game= Game()
airport= Airport()
weather= Weather()

@app.route('/create_player', methods=['POST'])
def create_player():
    data=request.json
    print("Received data:", data)
    player_id= game.create_player(
        data['p_name'],
        data['start_money'],
        data['start_range'],
        data['start_time'],
        data['current_airport'],
        data['health'],
        data['airports']
    )
    return json.dumps({'player_id':player_id})

@app.route('/fetch_airports', methods=['GET'])
def fetch_airports():
    airports= airport.fetch_airports()
    return jsonify({'airports':airports})

@app.route('/get_airport_by_icao')
def get_airport_by_icao():
    icao= request.args.get('icao')
    airport_data=airport.get_airport_by_icao(icao)
    return jsonify({'airport':airport_data})

@app.route('/airports_in_domain', methods=['POST'])
def airports_in_domain():
    data=request.json
    icao_code= data['icao_code']
    player_range= data['player_range']
    airports= data['airports']
    in_domain_airports= airport.airports_in_domain(icao_code, airports, player_range)
    return jsonify({'airports':in_domain_airports})

@app.route('/decrease_time')
def decrease_time():
    data=request.json
    new_time= game.decrease_time(data['player_id'])
    return json.dumps({'new_time':new_time})

@app.route('/check_health')
def check_health():
    player_id= request.args.get('player_id')
    message=game.check_health(player_id)
    return json.dumps({'message':message})

@app.route('/can_player_travel')
def can_player_travel():
    data=request.json
    message= game.can_player_travel(
        data['player_id'],
        data['lat'],
        data['lon'],
    )
    return json.dumps({'message':message})

@app.route('/fetch_riddles')
def fetch_riddles():
    riddle=game.fetch_riddles()
    return json.dumps({'riddle':riddle})

@app.route('/fetch_difficult_riddles')
def fetch_difficult_riddles():
    riddle=game.fetch_difficult_riddles()
    return json.dumps({'riddle':riddle})

@app.route('/check_riddle_answers')
def check_riddle_answers():
    data=request.json
    correct_answers=game.check_riddle_answers(data['riddle_answers'])
    return json.dumps({'correct_answers':correct_answers})
@app.route('/fetch_hints')
def fetch_hints():
    data=request.json
    hint= game.fetch_hints(
        data['player_id'],
        data['riddle_answers'],
    )
    return json.dumps({'hint':hint})

@app.route('/get_weather_for_airports')
def get_weather_for_airports():
    airport_weather=weather.get_weather_for_airports()
    return json.dumps({'airport_weather':airport_weather})

if __name__ == '__main__':
    app.run(use_reloader=True, host='127.0.0.1', port=5000)
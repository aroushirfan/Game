from flask import Flask, request, jsonify
from flask_cors import CORS
import json

from game import Game
from airport import Airport
from weather import Weather
from target import Target

app=Flask(__name__)
CORS(app)

game= Game()
airport= Airport()
weather= Weather()
target= Target()


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

@app.route('/get_weather_for_airports')
def get_weather_for_airports():
    airport_weather=weather.get_weather_for_airports()
    return json.dumps({'airport_weather':airport_weather})

@app.route('/update_player', methods=['POST'])
def update_player():
    data=request.json
    icao= data['icao']
    player_id=data['player_id']
    player_range= data['player_range']
    player_money= data['player_money']
    player_time= data['player_time']
    player_health= data['player_health']
    game.update_player(icao,player_id,player_range,player_money,player_time,player_health)
    return jsonify({'status':'success'})

@app.route('/check_targets', methods=['POST'])
def check_targets():
    data=request.json
    player_id= data['player_id']
    current_airport= data['current_airport']
    target_info= target.check_target(player_id,current_airport)
    return jsonify({'targets': target_info})

@app.route('/decrease_time', methods=['POST'])
def decrease_time():
    data=request.json
    new_time= game.decrease_time(data['player_id'])
    return json.dumps({'new_time':new_time})

@app.route('/decrease_health', methods=['POST'])
def decrease_health():
    data=request.json
    new_health= game.decrease_health(data['player_id'])
    return json.dumps({'new_health':new_health})

@app.route('/calculate_distance', methods=['POST'])
def calculate_distance():
    data=request.json
    current_airport=data['current_airport']
    target_airport=data['target_airport']
    distance= airport.calculate_distance_by_coordinates(current_airport,target_airport)
    return jsonify({'distance':distance})

@app.route('/airports_in_domain', methods=['POST'])
def airports_in_domain():
    data=request.json
    icao_code= data['icao_code']
    player_range= data['player_range']
    airports= Airport()
    in_domain_airports= Airport().airports_in_domain(icao_code, airports, player_range)
    return jsonify({'in_domain_airports':in_domain_airports})


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

@app.route('/check_riddle_answers', methods=['POST'])
def check_riddle_answers():
    data=request.json
    correct_answers=game.check_riddle_answers(data['riddle_answers'])
    return json.dumps({'correct_answers':correct_answers})

@app.route('/check_difficult_riddle_answers', methods=['POST'])
def check_difficult_riddle_answers():
    data=request.json
    correct_answers=game.check_difficult_riddle_answers(data['riddle_answers'])
    return json.dumps({'correct_answers':correct_answers})

@app.route('/fetch_hints', methods=['POST'])
def fetch_hints():
    data=request.json
    hint= game.fetch_hints(
        data['player_id'],
        data['riddle_answers'],
    )
    return json.dumps({'hint':hint})



if __name__ == '__main__':
    app.run(use_reloader=True, host='127.0.0.1', port=5000)
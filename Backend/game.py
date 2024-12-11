from config import get_db_conn
from airport import Airport
from target import Target
from weather import Weather
import random


class Game:
    def __init__(self):
        self.db = get_db_conn()
        self.airport = Airport()
        self.target = Target()
        self.weather = Weather()

    def create_player(self, p_name, start_money, start_range, start_time, current_airport, health, air_ports):
        sql = "INSERT INTO player (name,money,given_range,time,current_airport_id, health) VALUES (%s, %s, %s, %s, %s, %s)"
        cursor = self.db.cursor(dictionary=True)
        cursor.execute(sql, (p_name, start_money, start_range, start_time, current_airport, health))
        self.db.commit()
        play_id = cursor.lastrowid

        targets = self.target.fetch_targets()
        target_list = []
        for target in targets:
            for i in range(0, target['probability'], 1):
                target_list.append(target['id'])

        airports_with_targets = air_ports[1:].copy()
        random.shuffle(airports_with_targets)

        for i, targ_id in enumerate(target_list):
            sql = "INSERT INTO target_location (target_id, player_id, location) VALUES (%s, %s, %s)"
            cursor = self.db.cursor(dictionary=True)
            cursor.execute(sql, (targ_id, play_id, airports_with_targets[i]["ident"]))
        return play_id

    def update_player(self, icao, player_id, player_range, player_money, player_time, player_health):
        sql = f'''UPDATE player SET current_airport_id = %s, given_range = %s, money = %s, time=%s, health = %s WHERE id = %s'''
        cursor = self.db.cursor(dictionary=True)
        cursor.execute(sql, (icao, player_range, player_money, player_time, player_health, player_id))
        return cursor.rowcount

    def decrease_time(self, player_id):
        sql = "SELECT time FROM player WHERE id = %s"
        cursor = self.db.cursor(dictionary=True)
        cursor.execute(sql, (player_id,))
        result = cursor.fetchone()
        current_time = result['time']
        new_time = current_time - 30
        sql_update_time = "UPDATE player SET time = %s WHERE id = %s"
        cursor.execute(sql_update_time, (new_time, player_id))
        return new_time

    def decrease_health(self, player_id):
        sql = "SELECT health FROM player WHERE id = %s"
        cursor = self.db.cursor(dictionary=True)
        cursor.execute(sql, (player_id,))
        result = cursor.fetchone()
        current_health = result['health']
        new_health = max(current_health - 10, 0)
        sql_update_time = "UPDATE player SET time = %s WHERE id = %s"
        cursor.execute(sql_update_time, (new_health, player_id))
        return new_health


    def fetch_riddles(self):
        sql = "SELECT * FROM riddles ORDER BY RAND() LIMIT 1"
        cursor = self.db.cursor(dictionary=True)
        cursor.execute(sql)
        return cursor.fetchone()

    def check_riddle_answers(self, riddle_answers):
        correct_answers = 0
        for riddle_id, player_answer in riddle_answers.items():
            sql = ("SELECT answer FROM riddles WHERE id = %s")
            cursor = self.db.cursor(dictionary=True)
            cursor.execute(sql, (riddle_id,))
            result = cursor.fetchone()
            if result and result['answer'] == player_answer:
                correct_answers += 1
        return correct_answers

    def fetch_difficult_riddles(self):
        sql = "SELECT * FROM difficult_riddles ORDER BY RAND() LIMIT 1"
        cursor = self.db.cursor(dictionary=True)
        cursor.execute(sql)
        return cursor.fetchone()

    def check_difficult_riddle_answers(self, riddle_answers):
        correct_answers = 0
        for riddle_id, player_answer in riddle_answers.items():
            sql = ("SELECT answer FROM difficult_riddles WHERE id = %s")
            cursor = self.db.cursor(dictionary=True)
            cursor.execute(sql, (riddle_id,))
            result = cursor.fetchone()
            if result and result['answer'] == player_answer:
                correct_answers += 1
        return correct_answers

    def fetch_hints(self, player_id, riddle_answers):
        correct_answers = self.check_difficult_riddle_answers(riddle_answers)
        if correct_answers >= 1:
            sql = "SELECT location FROM target_location WHERE player_id=%s AND target_id= 5 ORDER BY RAND() LIMIT 1"
            cursor = self.db.cursor(dictionary=True)
            cursor.execute(sql, (player_id,))
            result = cursor.fetchone()

            if result:
                target_airport_id = result['location']
                sql = "SELECT hint FROM hints WHERE airport_id=%s ORDER BY RAND() LIMIT 1"
                cursor.execute(sql, (target_airport_id,))
                hint = cursor.fetchone()
                if hint:
                    return hint['hint']
        return "Solve all riddles to get a hint"

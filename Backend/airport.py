from geopy import distance
from config import get_db_conn

class Airport:
    def __init__(self):
        self.db = get_db_conn()

    def fetch_airports(self):
        print("fetch_airports method called.")
        sql = """SELECT airport.name AS airport_name, ident, type, latitude_deg, longitude_deg
                            FROM airport
                            WHERE continent = "AS";"""
        cursor = self.db.cursor(dictionary=True)
        cursor.execute(sql)
        result = cursor.fetchall()
        return result

    def get_airport_by_icao(self, icao):
        sql = f"""SELECT airport.name AS airport_name, ident, type, latitude_deg, longitude_deg
        FROM airport
        WHERE ident=%s"""
        cursor = self.db.cursor(dictionary=True)
        cursor.execute(sql, (icao,))
        result = cursor.fetchone()
        return result

    def calculate_distance_by_coordinates(self, current_airport, target_airport):
        first = self.get_airport_by_icao(current_airport)
        second = self.get_airport_by_icao(target_airport)
        return distance.distance((first['latitude_deg'], first['longitude_deg']),
                                 (second['latitude_deg'], second['longitude_deg'])).km
    def airports_in_domain(self, icao_code, air_ports, player_range):
        air_ports= self.fetch_airports()
        in_domain_airports = []
        for air_port in air_ports:
            dist_ance = self.calculate_distance_by_coordinates(icao_code, air_port['ident'])
            if 0 < dist_ance <= player_range:
                in_domain_airports.append(air_port)
        return in_domain_airports

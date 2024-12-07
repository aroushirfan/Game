import requests
from airport import Airport

APIkey = "8d3d5c48d959d00c7826bf07c570923b"

class Weather:
    def __init__(self):
        self.airport = Airport()

    def fetch_weather(self, lat, lon):
        request = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={APIkey}&units=metric"

        try:
            response = requests.get(request)
            if not response.ok:
                raise Exception("Resource not found.")

            weather = response.json()
            weather_info = {
                "temperature": weather["main"]["temp"],
                "description": weather["weather"][0]["description"],
                "icon": weather["weather"][0]["icon"]
            }
            return weather_info

        except Exception as e:
            return e

    def get_weather_for_airports(self):
        airports= self.airport.fetch_airports()
        for airport in airports:
            weather= self.fetch_weather(airport['latitude_deg'], airport['longitude_deg'])
            airport['weather'] = weather
            return airports

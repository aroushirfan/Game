from config import get_db_conn

class Target:
    def __init__(self):
        self.db=get_db_conn()

    def fetch_targets(self):
        sql = "SELECT * FROM target"
        cursor = self.db.cursor(dictionary=True)
        cursor.execute(sql)
        result = cursor.fetchall()
        return result

    def check_target(self, player_id, current_airport):
        sql = f"""SELECT target_location.id, target.id as target_id, name, value
        FROM target_location JOIN target ON target.id= target_location.target_id
        WHERE player_id= %s AND location= %s"""
        cursor = self.db.cursor(dictionary=True)
        cursor.execute(sql, (player_id, current_airport))
        result = cursor.fetchone()
        if result is None:
            return False
        return result
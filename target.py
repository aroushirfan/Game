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
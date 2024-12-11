import mysql.connector


def get_db_conn():
    return mysql.connector.connect(
        host='127.0.0.1',
        port=3306,
        database='game',
        user='root',
        password='12345',
        autocommit=True,
        collation='utf8mb4_unicode_ci'
    )

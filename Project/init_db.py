# init_db.py
import sqlite3

def init_db():
    conn = sqlite3.connect('platepilot.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL, 
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            age INTEGER,
            weight REAL,
            height REAL,
            gender TEXT,
            goal TEXT,
            restrictions TEXT
        )
    ''')
    conn.commit()
    conn.close()
    print("Database created!")

if __name__ == "__main__":
    init_db()
import pandas as pd
import sqlite3
import sys
from pathlib import Path

help_flags = {"h", "-h", "--h", "help", "-help", "--help"}

if(len(sys.argv) > 1):
    if sys.argv[1].lower() in help_flags:
        print("""
              -----                     build_db.py help                        -----
              -----                  Do you really need this?                   -----
              -----                                                             -----
              ----- USAGE: Builds initial database using food.csv, nutrient.csv -----
              ----- food_nutrient.csv, food_portion.csv, and branded_food.csv   -----
              ----- THIS SCRIPT WILL REPLACE THE TABLES THAT ALREADY EXIST IF   -----
              -----      THE 'PlatePilot.db' EXISTS IN THE SAME DIRECTORY      -----
              -----                      AS THIS SCRIPT                         -----
              -----       FoodData_Central_csv_2025-12-18 folder must be        -----
              -----                 adjacent to this script                     -----
              -----                                                             -----
              -----                        Good luck!                           -----
              """)
        sys.exit(0)
    else:
        print("""Error: unexpected arguments... see usage...\n
              -----           USAGE: python build_db.py             -----
              -----        OR: python build_db.py <argument>        -----
              -----   Acceptable args: h -h --h help -help --help   -----
              """)
        sys.exit(1)

db_dir = Path(__file__)

conn = sqlite3.connect('../db/PlatePilot.db')
cursor = conn.cursor()

files = ['food', 'nutrient', 'food_nutrient', 'food_portion', 'food_category', 'branded_food']

for file in files:
    try:
        # Check if table already exists
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            (file,)
        )
        exists = cursor.fetchone()

        if exists:
            print(f"Table '{file}' already exists. Skipping import.")
            continue

        df = pd.read_csv(
            f'../db/FoodData_Central_csv_2025-12-18/{file}.csv',
            low_memory=False
        )

        print(f"Building table for {file}")
        df.to_sql(file, conn, index=False)
        print(f"Imported {file} table.")

    except Exception as e:
        print(f"Unexpected error occurred...\n{e}\nExiting...")
        conn.close()
        sys.exit(1)

# Create blank users table if it does not exist
cursor.execute("""
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    age INTEGER,
    sex TEXT,
    height_inches INTEGER,
    weight_lbs INTEGER,
    goal INTEGER,
    activity_level INTEGER
)
""")

print("Ensured users table exists.")

#Create Restrictions table
cursor.execute("""
CREATE TABLE IF NOT EXISTS Restrictions (
    restrictionId INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);
""")
restrictions = [("Vegan",), ("Vegetarian",), ("Gluten-Free",), ("Dairy-Free",), ("Keto",), ("Nut-Free",), ("Pescatarian",), ("Lactose-Free",)]
cursor.executemany(
    "INSERT OR IGNORE INTO Restrictions (name) VALUES (?)",
    restrictions
)

print("Ensured restrictions table exists.")

#Create UserRestrictions table
cursor.execute("""
CREATE TABLE IF NOT EXISTS UserRestrictions (
    userId INTEGER,
    restrictionId INTEGER,
    PRIMARY KEY (userId, restrictionId),
    FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE,
    FOREIGN KEY (restrictionId) REFERENCES Restrictions(restrictionId) ON DELETE CASCADE
);
""")

print("Ensured user restrictions table exists.")

#Create Goals Table
cursor.execute("""
CREATE TABLE IF NOT EXISTS Goals (
    goalsId INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);
""")
goals = [("Lose",), ("Maintain",), ("Gain",)]
cursor.executemany(
    "INSERT OR IGNORE INTO Goals (name) VALUES (?)",
    goals
)

print("Ensured goals table exists.")

conn.commit()
conn.close()

import pandas as pd
import sqlite3
import sys
import os 

from pathlib import Path
from food_search import connectDB
from updateTables import buildQuery, runQuery

help_flags = {"h", "-h", "--h", "help", "-help", "--help"}

def checkArgs():
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


def build_food_table(conn):
    files = ['food', 'nutrient', 'food_nutrient', 'food_portion', 'food_category']
    try:
        for file in files:
            print(f"Reading {file}.csv...")
            df = pd.read_csv(f'../db/FoodData_Central_csv_2025-12-18/{file}.csv', low_memory=False)
            print(f"Building table for {file}")
            df.to_sql(file, conn, if_exists='replace', index=False)
            print(f"Imported {file} table.")
    except sqlite3.OperationalError as e:
        print(f"SQL Operation error occurred...\n{e}\nExiting...")
        conn.close()
        sys.exit(1)


def nuke_food_table(conn):
    cursor = conn.cursor()
    
    try:
        cursor.execute(f"""
        CREATE INDEX IF NOT EXISTS idx_food_nutrient_fdc_id ON food_nutrient(fdc_id);
        """)
        cursor.execute(f"""
        DELETE FROM food
        WHERE fdc_id IN (
            SELECT f.fdc_id
            FROM food f
            LEFT JOIN food_nutrient fn ON f.fdc_id = fn.fdc_id
            WHERE fn.fdc_id IS NULL
        );
        """)
        cursor.execute(f"""
        DELETE FROM food
        WHERE fdc_id IN (
            SELECT f.fdc_id
            FROM food f
            LEFT JOIN food_nutrient fn_energy ON f.fdc_id = fn_energy.fdc_id AND fn_energy.nutrient_id IN (1008, 2047)
            LEFT JOIN food_nutrient fn_macros ON f.fdc_id = fn_macros.fdc_id AND fn_macros.nutrient_id IN (1003, 1004, 1005)
            GROUP BY f.fdc_id
            HAVING
                (MAX(CASE WHEN fn_energy.nutrient_id IN (1008, 2047) THEN fn_energy.amount ELSE 0 END) = 0)
                AND
                (MAX(CASE WHEN fn_macros.nutrient_id IN (1003, 1004, 1005) THEN fn_macros.amount ELSE 0 END) > 0)
        );
        """)
    except sqlite3.OperationalError as e:
        print(f"Error: {e}\nExiting...")
        conn.close()
        sys.exit(1)

def build_users_table(conn, cursor):
    cursor.execute("DROP TABLE IF EXISTS Users")
    cursor.execute("""
    CREATE TABLE Users (
        userId INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        reset_token TEXT,
        reset_token_expiry TEXT,
        date_of_birth TEXT,
        account_creation_date TEXT,
        sex TEXT,
        height_inches INTEGER,
        weight_lbs INTEGER,
        goal INTEGER,
        activity_level INTEGER,
        profile_picture TEXT
    )
    """)

def build_restrictions_table(conn, cursor):
    cursor.execute("DROP TABLE IF EXISTS Restrictions")
    print(f"Attempting to build Restrictions table")
    cursor.execute("""
    CREATE TABLE Restrictions (
        restrictionId INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    )
    """)
    cursor.execute('INSERT INTO Restrictions (restrictionId, name) VALUES (0, ?)', ('None',))
    restrictions = ["Vegetarian", "Vegan", "Nut-Allergy", "Egg-Allergy", "Shellfish-Allergy", "Soy-Allergy", "Dairy-Free", "Pescatarian", "Keto"]
    for restriction in restrictions:
        cursor.execute("INSERT INTO Restrictions (name) VALUES (?)", (restriction,))
    print("Finished building Restrictions table\n")

def build_user_restrictions_table(conn, cursor):
    cursor.execute("DROP TABLE IF EXISTS UserRestrictions")
    print(f"Attempting to build UserRestrictions table...")
    cursor.execute("""
    CREATE TABLE UserRestrictions (
        userId INTEGER,
        restrictionId INTEGER,
        PRIMARY KEY (userId, restrictionId),
        FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE,
        FOREIGN KEY (restrictionId) REFERENCES Restrictions(restrictionId) ON DELETE CASCADE
    )
    """)
    print("Finished building UserRestrictions table\n")

def build_goals_table(conn, cursor):
    cursor.execute("DROP TABLE IF EXISTS Goals")
    print(f"Attempting to build Goals table...")
    cursor.execute("""
    CREATE TABLE Goals (
        goalsId INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    )
    """)
    goals = [("Lose",), ("Maintain",), ("Gain",)]
    cursor.executemany("INSERT INTO Goals (name) VALUES (?)", goals)
    print("Finished building Goals table\n")

def build_food_history_table(conn, cursor):
    cursor.execute("DROP TABLE IF EXISTS FoodHistory")
    print(f"Attempting to build FoodHistory table...")
    cursor.execute("""
    CREATE TABLE FoodHistory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        fdc_id INTEGER NOT NULL,
        foodName TEXT NOT NULL,
        portion REAL NOT NULL,
        unit TEXT NOT NULL,
        gram_weight REAL NOT NULL,
        dateLogged DATE NOT NULL,
        timeLogged TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mealTag TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
    )
    """)
    print("Finished building FoodHistory table\n")

def build_top_foods_table(conn, cursor):
    cursor.execute("DROP TABLE IF EXISTS TopFoods")
    print(f"Attempting to build TopFoods table...")
    cursor.execute("""
    CREATE TABLE TopFoods (
        fdc_id INTEGER,
        description TEXT,
        nutrient_id INTEGER,
        amount_per_gram REAL,
        food_category_id INTEGER,
        PRIMARY KEY (fdc_id, nutrient_id)
    );
    """)
    print(f"Finished building TopFoods table")

def build_food_restrictions_table(conn, cursor):
    cursor.execute("DROP TABLE IF EXISTS FoodRestrictions")
    cursor.execute("""
    CREATE TABLE FoodRestrictions (
        fdc_id INTEGER,
        restrictionId INTEGER,
        PRIMARY KEY (fdc_id, restrictionId),
        FOREIGN KEY (fdc_id) REFERENCES food(fdc_id),
        FOREIGN KEY (restrictionId) REFERENCES Restrictions(restrictionId) ON DELETE CASCADE
    )
    """)
    cursor.execute("CREATE INDEX idx_res_lookup ON FoodRestrictions(restrictionId)")
    print("Finished building FoodRestrictions junction table\n")

def populate_food_tags(conn, cursor):
    print("Labeling foods based on query templates...")
    
    tag_map = {
        1: "vegetarian_query.sql",
        2: "vegan_query.sql",
        3: "nut_allergy_query.sql",
        4: "egg_allergy_query.sql",
        5: "shellfish_allergy_query.sql",
        6: "soy_allergy_query.sql",
        7: "dairy_allergy_query.sql",
        8: "pescatarian_query.sql",
        9: "keto_query.sql"
    }

    query_dir = f"../scripts/query_templates" 

    for res_id, file_name in tag_map.items():
        path = os.path.join(query_dir, file_name)
        if os.path.exists(path):
            with open(path, 'r') as f:
                filter_sql = f.read().replace("{table_name}", "food")
                
            cursor.execute(f"""
                INSERT OR IGNORE INTO FoodRestrictions (fdc_id, restrictionId)
                SELECT fdc_id, {res_id} FROM ({filter_sql})
            """)
    print("Food labeling complete.\n")

def populate_top_foods(conn, cursor):
    sql_path = os.path.join(f"../scripts/query_templates", "insert_top_foods.sql")
    
    if not os.path.exists(sql_path):
        print(f"Error: Could not find {sql_path}. Skipping TopFoods insertion.")
        return

    print(f"Reading {sql_path} and inserting data into TopFoods...")
    
    try:
        with open(sql_path, 'r') as file:
            insert_query = file.read()
        
        cursor.execute(insert_query)
        conn.commit()
        print("Finished populating TopFoods table.\n")
        
    except sqlite3.Error as e:
        print(f"Error inserting into TopFoods: {e}")

def main():

    checkArgs()

    conn = connectDB()
    cursor = conn.cursor()

    build_food_table(conn)
    nuke_food_table(conn)

    build_users_table(conn, cursor)
    build_restrictions_table(conn, cursor)
    build_user_restrictions_table(conn, cursor)
    build_goals_table(conn, cursor)
    build_food_history_table(conn, cursor)

    categoryQuery, foodQuery, restrictionsQuery = buildQuery()
    runQuery(categoryQuery, foodQuery, restrictionsQuery, conn, cursor)

    build_food_restrictions_table(conn, cursor)
    populate_food_tags(conn, cursor)
    
    build_top_foods_table(conn, cursor)
    populate_top_foods(conn, cursor)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    main()

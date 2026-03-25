import pandas as pd
import sqlite3
import sys
from pathlib import Path

def checkArgs():
    if len(sys.argv) < 2: 
        print("Error: Missing arguments\n")
        printUsage()
        sys.exit(1)

def printUsage():
    print("""
        -----------------------------------------------------------------------------
        -----     USAGE: addTable.py table_name table_name2 ... table_nameN     -----
        -----------------------------------------------------------------------------
        ----------------------           CONDITIONS             ---------------------
        -----------------------------------------------------------------------------
        -----     table_name must not contain file extension table_name must    -----
        -----          exist inside sibling FoodData_Central directory          -----
        -----             Can pass as many table name args as you want          -----
        -----------------------------------------------------------------------------
        """)

def add_that_table():
    files = []
    for x in range(1, len(sys.argv)):
        files.append(sys.argv[x])
            
    db_dir = Path(__file__)

    conn = sqlite3.connect('..\db\master_food.db') #connects or creates local db

    for file in files:
        try:
            print(f"Looking for '{file}.csv'...\n")
            df = pd.read_csv(f'..\db\FoodData_Central_csv_2025-12-18/{file}.csv', low_memory=False)
            print(f"Found '{file}.csv', attempting to build table...")
            try:
                df.to_sql(file, conn, if_exists='fail', index=False)
                print(f"Imported {file} table.\n")
            except ValueError:
                print(f"Error: table '{file}' already exists...\nCONTINUING...\n")
        except FileNotFoundError:
            print(f"Error: '{file}.csv' not found in 'FoodData_Central_csv_2025-12-18/' directory\nCheck for the existence of '{file}.csv' inside the directory\nCONTINUING...\n")
        except Exception as e:
            print(f"Unexpected error occurred when trying to read '{file}.csv'\n{e}\nEXITING...")
            sys.exit(2)
    conn.close() 

checkArgs()
add_that_table()

print("Program ran successfully, exiting...")

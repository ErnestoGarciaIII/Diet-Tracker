import pandas
import sqlite3
import sys
import time
import numpy

from food_search import connectDB

def printUsage():
    print(f"""
    ----------------------------------------------------------------------
    -------                 ------   USAGE   ------                -------
    -------                                                        -------
    -------     Call: python updateTables.py                       -------
    -------                                                        -------
    -------    Adds food categories to the food_category table     -------
    -------                                                        -------
    -------   Candy, Ice Cream & Frozen Yogurt, Cookies & Biscuits -------
    -------   Chocolate, Nut & Seed Butters, Plant Based Milk,     -------
    -------   Soda, Cheese, Yogurt, Egg & Egg Substitutes, and     -------
    -------   Vegetarian Frozen Meats                              -------
    -------                                                        -------
    -------   Updates food table category_id column to match       -------
    -------   the new associated integers with those categories    -------
    -------   inserted into the food_category table                -------
    -------                                                        -------
    -------   Throws error if unable to connect to the db, ensure  -------
    -------   relative path arguments to the DB are correct        -------
    -------                                                        -------
    ----------------------------------------------------------------------
    """)

def printHelp():
    print(f"There is no help here, just read the USAGE...")

def checkArgs():
    if len(sys.argv) > 1:
        print(f"Too many arguments, see USAGE section")
        sys.exit(1)
    elif (sys.argv[0] == "-h" or sys.argv[0] == "-help" or sys.argv[0] == "--h" or sys.argv[0] == "--help"):
        printHelp()
        print("Exiting...")
        sys.exit(0)

def buildQuery():

    restrictionsQuery = f"""
    INSERT INTO Restrictions (restrictionId, name)
    VALUES 
        (0, 'None'),
        (1, 'Vegetarian'),
        (2, 'Vegan'),
        (3, 'Nut-Allergy'),
        (4, 'Egg-Allergy'),
        (5, 'Shellfish-Allergy'),
        (6, 'Soy-Allergy'),
        (7, 'Dairy-Free'),
        (8, 'Pescatarian'),
        (9, 'Keto');
    """

    categoryQuery = f"""
    INSERT INTO food_category (id, code, description)
    VALUES 
        (29, NULL, 'Candy'),
        (30, NULL, 'Ice Cream & Frozen Yogurt'),
        (31, NULL, 'Cookies & Biscuits'),
        (32, NULL, 'Chocolate'),
        (33, NULL, 'Nut & Seed Butters'),
        (34, NULL, 'Plant Based Milk'),
        (35, NULL, 'Soda'),
        (36, NULL, 'Cheese'),
        (37, NULL, 'Yogurt'),
        (38, NULL, 'Egg & Egg Substitutes'),
        (39, NULL, 'Vegetarian Frozen Meats'),
        (40, NULL, 'Frozen Appetizers & Hors D''oeuvres');
    """
    foodQuery = f"""
    UPDATE food
    SET food_category_id = c.id
    FROM food_category c
    WHERE food_category_id = c.description;
    """
    
    return categoryQuery, foodQuery, restrictionsQuery

def runQuery(categoryQuery, foodQuery, restrictionsQuery, conn, cursor):
    
    try:
        cursor.execute("DELETE FROM Restrictions")
        cursor.execute("DELETE FROM food_category WHERE id BETWEEN 29 AND 40")
        print(f"Attempting to Insert new values into food_category...\n")
        cursor.execute(categoryQuery)
        print(f"Finished inserting values...")
        print(f"Attempting to update food table category_id column...\n")
        cursor.execute(foodQuery)
        print(f"Finished updating category_id column...\n")
        print(f"Im gonna fugg up that Restrictions table muahahahahahhaa >:) ")
        cursor.execute(restrictionsQuery)

    except sqlite3.OperationalError as e:

        print(f"Unable to execute cursor command...")
        print(e)
        sys.exit(2)


def main():
    printUsage()
    print(len(sys.argv))
    checkArgs()
    
    categoryQuery, foodQuery, restrictionsQuery = buildQuery()
    conn = connectDB()
    cursor = conn.cursor()
    runQuery(categoryQuery, foodQuery, restrictionsQuery, conn, cursor)



if __name__ == "__main__":
    main()


# Created by: Ingrid Sanchez
# Purpose: Search for food items based on user input (Back-end logic). 
#          Dietary filtering, normalized search results, and nutrient data retrieval 

import sqlite3
import sys
import os

def connectDB():
    try: 
        connection = sqlite3.connect(f"../db/PlatePilot.db", check_same_thread=False)
    except sqlite3.OperationalError as e:
        print(f"Unable to connect to the database...")
        print(e)
        sys.exit(1)
    return connection

db_connection = connectDB()
active_filters = set()

def apply_filter(filter_id, connection, active_user_filters):

    if filter_id in active_user_filters:
        active_user_filters.remove(filter_id)
    else:
        active_user_filters.add(filter_id)

    print(f"Added Filter of Number ${filter_id} to active_user_filters {active_user_filters}")

def clear_user_filters(user_id, active_user_filters):
    if user_id in active_user_filters:
        del active_user_filters[user_id]
    print(f"User {user_id} has cleared all active filters.")

def search_engine(user_input, connection, active_user_filters):
   
    filter_list = list(active_user_filters)
    cursor = connection.cursor()
    
    if len(filter_list) == 0:
        restriction_join = ""
        restriction_where = ""
        restriction_having = ""
    else:
        placeholders = ', '.join(['?'] * len(filter_list))
        restriction_join = "INNER JOIN FoodRestrictions fr ON f.fdc_id = fr.fdc_id"
        restriction_where = f"AND fr.restrictionId IN ({placeholders})"
        restriction_having = f"HAVING COUNT(DISTINCT fr.restrictionId) = {len(filter_list)}"
    
    search_engine_query = f"""
    WITH SearchEngine AS (
        SELECT
            f.fdc_id,
            f.description AS product_name,
            fc.description AS category_name,
            TRIM(CASE
                WHEN f.description LIKE '% - %'
                THEN SUBSTR(f.description, 1, INSTR(f.description, ' - ') - 1)
                ELSE f.description
            END) AS trim_hyphen
        FROM food f
        INNER JOIN food_category fc ON f.food_category_id = fc.id
        {restriction_join}
        WHERE fc.id NOT IN (3, 21, 22, 25, 27)
          AND f.description LIKE ?
          AND (f.description NOT LIKE '%vitamin%' AND f.description NOT LIKE '%Fat,%' AND f.description NOT LIKE '%Cholesterol%' AND f.description NOT LIKE '%Thiamin%' AND f.description NOT LIKE '%Riboflavin%' AND f.description NOT LIKE '%Carotenoids%' AND f.description NOT LIKE '%Selenium%' AND f.description NOT LIKE '%Minerals%' AND f.description NOT LIKE '%Proximates%' AND f.description NOT LIKE '%Niacin%' AND f.description NOT LIKE '%Pantothenic%' AND f.description NOT LIKE '%Choline%' AND f.description NOT LIKE '%Retinol%' AND f.description NOT LIKE '%Amino Acid%' AND f.description NOT LIKE '%FA,%' AND f.description NOT LIKE '%rep %' AND f.description NOT LIKE '%Fatty Acid%' AND f.description NOT LIKE '%Pass %' AND f.description NOT LIKE '%Region %' AND f.description NOT LIKE '%bunch%' AND f.description NOT LIKE '% Ct%' AND f.description NOT LIKE '%Moisture%' AND f.description NOT LIKE '%, NF%' AND f.description NOT LIKE '%, C9%' AND f.description NOT LIKE '%restaurant%' AND f.description NOT LIKE '%lbs,%')
          {restriction_where}
        GROUP BY f.fdc_id
        {restriction_having}
    ),
    FilterSuffix AS (
        SELECT
            fdc_id,
            category_name,
            TRIM(CASE
                WHEN trim_hyphen LIKE '% (%'
                THEN SUBSTR(trim_hyphen, 1, INSTR(trim_hyphen, ' (') - 1)
                ELSE trim_hyphen
            END) AS trim_paren
        FROM SearchEngine
    ) 
    SELECT
        MIN(fdc_id) as fdc_id,
        trim_paren,
        category_name
    FROM FilterSuffix
    GROUP BY trim_paren
    ORDER BY fdc_id;
    """
    pre_converted = user_input.split()
    converted_to_wildcard = "%" + "%".join(pre_converted) + "%"
    parameters = [converted_to_wildcard] + filter_list
    cursor.execute(search_engine_query, parameters)
    
    return cursor.fetchall()

def grab_nutrients(user_input, connection):

    '''
        Input: List of fdc_ids
        Output: grab_nutrients query results
    '''
    cursor = connection.cursor()

    cwd = os.getcwd()
    parent = os.path.normpath(os.path.join(cwd, f".."))
    query_dir = os.path.abspath(os.path.join(parent, "scripts/query_templates"))

    with open(os.path.join(query_dir, "grab_nutrients.sql"), "r") as f:
        grab_nutrients_query = f.read()

    # User input is a list of fdc_ids
    fdc_ids = user_input
    fdc_ids_for_query = ",".join(["?"] * len(fdc_ids))

    # Getting nutrient per 1g portion
    grab_nutrients_query = grab_nutrients_query.replace("{FDC_IDS}", fdc_ids_for_query)

    cursor.execute(grab_nutrients_query, fdc_ids)
    grab_nutrients_query_result = cursor.fetchall()

    return grab_nutrients_query_result

import sqlite3
import os
import sys

from food_search import connectDB

def rate_food(food_nutrients, consumed_nutrients, dri, upper_limits):
    #food nutrients is the dict of nutrients 
    #consumed_nutrients is the current progress of the user'
    #dri - Self explanatory >_>
    #upper limits - dict of safe overconsumption value of each nutrient to use as a discouraging weight

    score = 0.0
    for nutrient, food_amount in food_nutrients.items():
        if nutrient not in dri:
            continue
        
        remaining = max(0, dri[nutrient] - consumed_nutrients[nutrient])
        
        deficit = remaining / dri[nutrients]

        fill = min(food_amount, remaining)
        benefit = (deficit ** 2) * (fill / dri[nutrient])

        over_consumption_penalty = 0.0
        if nutrient in upper_limits:
            over_consumption_penalty, severity = upper_limits[nutrient]
            if over_consumption_penalty is not None:
                projected = consumed_nutrients[nutrient] + food_amount
                if projected > ul_value: 
                    over_consumption_percent = (projected - ul_value) / ul_value
                    over_consumption_penalty = severity * (overage_pct ** 2)
        
        score += benefit - ul_penalty

    return score

def execute_query(conn, nutrient):
    nutrient_query = """
    SELECT 
        fn.fdc_id,
	    n.name,
	    fn.amount / 100 AS adjusted_nutrient,
	    n.unit_name
    FROM food_nutrient fn
    JOIN nutrient n ON fn.nutrient_id = n.id
    WHERE n.id = ?
    ORDER by n.name;
    """
    
    cursor = conn.cursor()

    try:
        print(f"Executing query for nutrient id: {nutrient}")
        cursor.execute(nutrient_query, nutrient)
    except sqlite3.OperationalError as e:
        print(f"SQL Error during execution...\n{e}")
        sys.exit(1)

    return cursor.fetchall()

def grab_best_foods(nutrient, conn):
    
    rows = execute_query(conn, nutrient)

    list_of_foods = []

    for row in rows:
        if len(list_of_foods) < 100:
            list_of_foods.append([row[0], row[2]])
        else:
            minimum_value = min(range(len(list_of_foods)), key=lambda i: list_of_foods[i][1])
            if row[1] > list_of_foods[minimum_value][1]:
                list_of_foods[minimum_value] = [row[0], row[2]]

    return list_of_foods

def main():
    
    conn = connectDB()
    
    nutrient_list = [1003, 1053, 1005, 1050, 1072, 2039, 1004, 1049, 1085, 1257, 1258, 1292, 1293, 1106, 1162, 1114, 1175, 1158, 1079, 1109, 1185, 1165, 1178, 1166, 1177, 1167, 1180, 1089, 1170, 1176, 1087,  1096, 1098, 1099, 1100, 1238, 1090, 1101, 1102, 1091, 1092, 1103, 1093, 1095]
    
    list_of_foods = []
    x = 0
    for nutrient in nutrient_list:
        list_of_foods[x] = grab_best_foods(nutrient, conn)
        x++
if __name__ == "__main__":
    main()

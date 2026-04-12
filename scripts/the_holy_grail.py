import sqlite3
import os
import sys

from food_search import connectDB

NUTRIENT_ID_TO_NAME = {
    1003: "Protein",
    1004: "Fats",
    1005: "Carbs",
    1079: "Fiber",
    1087: "Calcium",
    1089: "Iron",
    1090: "Magnesium",
    1091: "Phosphorus",
    1092: "Potassium",
    1093: "Sodium",
    1095: "Zinc",
    1098: "Copper",
    1101: "Manganese",
    1103: "Selenium",
    1106: "Vitamin A",
    1109: "Vitamin E",
    1114: "Vitamin D",
    1162: "Vitamin C",
    1165: "Vitamin B-6",
    1175: "Thiamin",
    1176: "Riboflavin",
    1177: "Niacin",
    1178: "Vitamin B-12",
    1180: "Pantothenic acid",
    1183: "Vitamin K",
    1185: "Folate",
    1170: "Choline",
}

def load_candidate_pool(conn):
    cursor = conn.cursor()
    cursor.execute("""
        SELECT fdc_id, description, nutrient_id, amount_per_gram
        FROM TopFoods
    """)
    rows = cursor.fetchall()

    pool = {}
    for fdc_id, description, nutrient_id, amount_per_gram in rows:
        if fdc_id not in pool:
            pool[fdc_id] = {'name': description, 'nutrients': {}}
        nutrient_name = NUTRIENT_ID_TO_NAME.get(nutrient_id)
        if nutrient_name:
            pool[fdc_id]['nutrients'][nutrient_name] = amount_per_gram

    return pool


def rate_food(food_nutrients, consumed_nutrients, dri, upper_limits):
    score = 0.0
    for nutrient, food_amount in food_nutrients.items():
        if nutrient not in dri:
            continue

        remaining = max(0, dri[nutrient] - consumed_nutrients[nutrient])
        deficit = remaining / dri[nutrient]
        fill = min(food_amount, remaining)
        benefit = (deficit ** 2) * (fill / dri[nutrient])

        over_consumption_penalty = 0.0
        if nutrient in upper_limits:
            ul_value, severity = upper_limits[nutrient]
            if ul_value is not None:
                projected = consumed_nutrients[nutrient] + food_amount
                if projected > ul_value:
                    over_consumption_percent = (projected - ul_value) / ul_value
                    over_consumption_penalty = severity * (over_consumption_percent ** 2)

        score += benefit - over_consumption_penalty
    return score


def recommend_foods(user, conn, consumed, serving_grams=100.0, iterations=5):
    pool = load_candidate_pool(conn)

    dri = {**user.macros, **user.micros}

    recommendations = []

    for i in range(iterations):
        best_fdc_id = None
        best_score = -float('inf')
        best_name = None

        for fdc_id, food in pool.items():
            scaled_nutrients = {
                nutrient: amount * serving_grams
                for nutrient, amount in food['nutrients'].items()
            }
            score = rate_food(scaled_nutrients, consumed, dri, user.upper_limits)

            if score > best_score:
                best_score = score
                best_fdc_id = fdc_id
                best_name = food['name']

        if best_fdc_id is None:
            break

        winner = pool[best_fdc_id]
        for nutrient, amount in winner['nutrients'].items():
            if nutrient in consumed:
                consumed[nutrient] += amount * serving_grams

        recommendations.append({
            'iteration': i + 1,
            'fdc_id': best_fdc_id,
            'name': best_name,
            'score': round(best_score, 4)
        })

    return recommendations

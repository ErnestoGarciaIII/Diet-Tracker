import sqlite3
import os
import sys

from food_search import connectDB

CATEGORY_SERVING_GRAMS = {
    1:  120.0,  # Dairy and Egg Products  — 1 cup milk / 2 eggs
    2:    2.0,  # Spices and Herbs        — ~1/2 tsp
    3:  120.0,  # Baby Foods              — reasonable jar portion
    4:   14.0,  # Fats and Oils           — 1 tbsp
    5:   85.0,  # Poultry Products        — 3 oz
    6:  240.0,  # Soups, Sauces, Gravies  — 1 cup
    7:   56.0,  # Sausages/Luncheon Meats — 2 oz
    8:   40.0,  # Breakfast Cereals       — ~1.5 oz dry
    9:  150.0,  # Fruits and Fruit Juices — medium fruit / 3/4 cup
    10:  85.0,  # Pork Products           — 3 oz
    11: 100.0,  # Vegetables              — ~3/4 cup
    12:  28.0,  # Nut and Seed Products   — 1 oz
    13:  85.0,  # Beef Products           — 3 oz
    14: 240.0,  # Beverages               — 1 cup
    15:  85.0,  # Finfish and Shellfish   — 3 oz
    16: 100.0,  # Legumes                 — ~1/2 cup cooked
    17:  85.0,  # Lamb, Veal, Game        — 3 oz
    18:  55.0,  # Baked Products          — ~2 oz / 1–2 slices
    19:  40.0,  # Sweets                  — small portion
    20:  45.0,  # Cereal Grains and Pasta — dry weight ~1.5 oz
    21: 200.0,  # Fast Foods              — single item estimate
    22: 250.0,  # Meals, Entrees          — full serving
    23:  28.0,  # Snacks                  — 1 oz
    24: 100.0,  # American Indian Foods   — general
    25: 200.0,  # Restaurant Foods        — full serving
    26: 100.0,  # Branded Products        — per-label serving fallback
    27: 100.0,  # Quality Control         — N/A, fallback
    28: 355.0,  # Alcoholic Beverages     — 12 oz beer equivalent
}
NUTRIENT_WEIGHTS = {
    "Vitamin D":        4.0,   
    "Vitamin K":        2.5,   
    "Vitamin E":        2.0,   
    "Folate":           2.0,   
    "Vitamin A":        5.0,  
    "Calcium":          1.5,   
    "Magnesium":        1.2,
    "Zinc":             1.2,
    "Fiber":            1.5,
}
DEFAULT_SERVING_GRAMS = 100.0
CALORIC_DENSITY_NUTRIENTS = {"Protein", "Carbs", "Fats"}
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

def load_candidate_pool(conn, restriction_ids=None):
    cursor = conn.cursor()

    if restriction_ids:
        placeholders = ",".join("?" * len(restriction_ids))
        cursor.execute(f"""
	    SELECT tf.fdc_id, tf.description, tf.nutrient_id, tf.amount_per_gram, tf.food_category_id
	    FROM TopFoods tf
	    WHERE tf.fdc_id NOT IN (
	        SELECT fdc_id FROM FoodRestrictions
		WHERE restrictionId IN ({placeholders})
	    )
	""", restriction_ids)
    else:
        cursor.execute("""
	    SELECT fdc_id, description, nutrient_id, amount_per_gram, food_category_id
	    FROM TopFoods
	""")

    rows = cursor.fetchall()

    pool = {}
    for fdc_id, description, nutrient_id, amount_per_gram, food_category_id in rows:
        if fdc_id not in pool:
            pool[fdc_id] = {'name': description, 'nutrients': {}, 'category_id': food_category_id}
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
        benefit = (deficit ** 3) * ((fill + 0.01) / dri[nutrient])

        weight = NUTRIENT_WEIGHTS.get(nutrient, 1.0)
        benefit *= weight

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


def recommend_foods(user, conn, consumed, iterations=5, restriction_ids=None):
    pool = load_candidate_pool(conn, restriction_ids=restriction_ids)

    dri = {**user.macros, **user.micros}

    recommendations = []
    
    already_recommended = set()

    for i in range(iterations):
        best_fdc_id = None
        best_score = -float('inf')
        best_name = None
        
        for fdc_id, food in pool.items():
            if fdc_id in already_recommended:
                continue

            serving_grams = CATEGORY_SERVING_GRAMS.get(
            	food.get('category_id'), DEFAULT_SERVING_GRAMS
            )

            macro_density = max(
                (
                    (food['nutrients'].get(n, 0) * 100) / dri.get(n, 1)
                    for n in CALORIC_DENSITY_NUTRIENTS
                        if n in food['nutrients']  and dri.get(n, 0) > 0
                ),
                default=0.0
            )
            if macro_density > 0.5:
                serving_grams = min(serving_grams, 15.0)
            elif macro_density > 0.15:
                serving_grams = min(serving_grams, 30.0)
            else:
                serving_grams = min(serving_grams, 100.0)

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
        
        already_recommended.add(best_fdc_id)

        winner = pool[best_fdc_id]
        winner_serving = CATEGORY_SERVING_GRAMS.get(
            winner.get('category_id'), DEFAULT_SERVING_GRAMS
            )
        for nutrient, amount in winner['nutrients'].items():
            if nutrient in consumed:
                consumed[nutrient] += amount * winner_serving

        recommendations.append({
            'iteration': i + 1,
            'fdc_id': best_fdc_id,
            'name': best_name,
            'score': round(best_score, 4),
            'suggested_serving_g': winner_serving,
            'suggested_serving_oz': round(winner_serving / 28.35, 1)
        })

    return recommendations

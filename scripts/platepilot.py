from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import sys
import os

# Add the directory containing PlatePilotUser.py to path
sys.path.insert(0, os.path.dirname(__file__))
from PlatePilotUser import ppuser

app = Flask(__name__,
            template_folder=os.path.join(os.path.dirname(__file__), '..', 'html')
            static_folder=os.path.join(os.path.dirname(__file__), '..', 'html'))

# ── Serve HTML pages ──────────────────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'Home.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)


# ── API: Calculate user DRI (macros + micros) ─────────────────────────────────
# POST /api/dri
# Body (JSON): { weight, height, age, sex, activity_level, goal }
# Returns: { macros: {...}, micros: {...}, BMR, TDEE }

@app.route('/api/dri', methods=['POST'])
def calculate_dri():
    data = request.get_json()
    try:
        user = ppuser(
            w  = float(data['weight']),        # kg
            h  = float(data['height']),        # cm
            a  = int(data['age']),
            s  = str(data['sex']),             # "male" or "female"
            al = int(data['activity_level']),  # 1-4
            g  = int(data['goal'])             # 1-5
        )
        user.setDRI()
        return jsonify({
            'macros': user.macros,
            'micros': user.micros,
            'BMR':    round(user.BMR, 1),
            'TDEE':   round(user.TDEE, 1)
        })
    except (KeyError, ValueError) as e:
        return jsonify({'error': str(e)}), 400


# ── API: Food search ──────────────────────────────────────────────────────────
# GET /api/search?q=chicken
# Returns: list of { food_name, category, nutrient_name, avg_amount, unit }

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'db', 'master_food.db')

NUTRIENT_IDS = [
    1106, 1162, 1114, 1175, 1158, 1079, 1109, 1185, 1165, 1178,
    1166, 1177, 1167, 1180, 1089, 1170, 1176, 1087, 1096, 1098,
    1099, 1100, 1238, 1090, 1101, 1102, 1091, 1092, 1103, 1093, 1095
]

@app.route('/api/search', methods=['GET'])
def search_food():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])

    search_term = f'%{query}%'
    placeholders = ', '.join(['?'] * len(NUTRIENT_IDS))

    sql = f"""
        WITH filtered_foods AS (
            SELECT f.fdc_id, f.description, fc.description as category
            FROM food f
            INNER JOIN food_category fc ON fc.id = f.food_category_id
            WHERE f.description LIKE ?
            AND fc.id NOT IN (3, 21, 22, 25)
        )
        SELECT
            ff.description   AS food_name,
            ff.category,
            n.name           AS nutrient_name,
            ROUND(AVG(fn.amount), 2) AS avg_amount,
            n.unit_name      AS unit
        FROM filtered_foods ff
        INNER JOIN food_nutrient fn ON ff.fdc_id = fn.fdc_id
        INNER JOIN nutrient n       ON fn.nutrient_id = n.id
        WHERE n.id IN ({placeholders})
        GROUP BY ff.description, n.id, n.unit_name
        LIMIT 500;
    """

    params = [search_term] + NUTRIENT_IDS

    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute(sql, params)
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify(rows)
    except sqlite3.OperationalError as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("PlatePilot server running at http://localhost:5000")
    app.run(debug=True, port=5000)

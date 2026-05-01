####### DEPRICATED PIECE OF SHART ################

from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import sys
import os



sys.path.insert(0, os.path.dirname(__file__))
from PlatePilotUser import ppuser

app = Flask(__name__,
            template_folder=os.path.join(os.path.dirname(__file__), '..', 'html'),
            static_folder=os.path.join(os.path.dirname(__file__), '..', 'html'))

@app.route('/stylesheets/<path:filename>')
def stylesheets(filename):
    import os
    style_path = os.path.join(app.static_folder, 'stylesheets')
    return send_from_directory(style_path, filename)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'home.html')

@app.route('/dashboard')
def dashboard():
    return send_from_directory(app.static_folder, 'dashboard.html')

@app.route('/logging')
def food_log():
    return send_from_directory(app.static_folder, 'foodLog.html')

@app.route('/goals')
def goals():
    return send_from_directory(app.static_folder, 'goals.html')

@app.route('/history')
def history():
    return send_from_directory(app.static_folder, 'history.html')

@app.route('/login')
def login():
    return send_from_directory(app.static_folder, 'login.html')

@app.route('/logout')
def logout():
    return send_from_directory(app.static_folder, 'logout.html')

@app.route('/register')
def register():
    return send_from_directory(app.static_folder, 'register.html')

@app.route('/settings')
def settings():
    return send_from_directory(app.static_folder, 'settings.html')

@app.route('/user_info')
def user_info():
    return send_from_directory(app.static_folder, 'userInfo.html')

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


DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'db', 'PlatePilot.db')

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

    search_name = f'{query}%'

    sql = f"""
        SELECT fdc_id, description AS food_name
        FROM food
            WHERE description LIKE ?
        LIMIT 40;
    """

    params = [search_name]

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


@app.route('/api/nutrients', methods=['GET'])
def get_nutrients():
    fdc_id = request.args.get('fdc_id', '').strip()
    if not fdc_id:
        return jsonify({'error': 'fdc_id is required'}), 400
 
    placeholders = ', '.join(['?'] * len(NUTRIENT_IDS))
 
    sql = f"""
        SELECT
            f.description          AS food_name,
            n.name                 AS nutrient_name,
            ROUND(AVG(fn.amount), 2) AS avg_amount,
            n.unit_name            AS unit
        FROM   food f
        INNER JOIN food_nutrient fn ON f.fdc_id      = fn.fdc_id
        INNER JOIN nutrient      n  ON fn.nutrient_id = n.id
        WHERE  f.fdc_id = ?
          AND  n.id IN ({placeholders})
        GROUP BY n.id, n.unit_name;
    """
 
    params = [fdc_id] + NUTRIENT_IDS
 
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur  = conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()
        conn.close()
 
        if not rows:
            return jsonify({'error': 'Food not found'}), 404
 
        food_name = rows[0]['food_name']
        nutrients = { r['nutrient_name']: r['avg_amount'] for r in rows }
 
        return jsonify({ 'food_name': food_name, 'nutrients': nutrients })
 
    except sqlite3.OperationalError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/<path:filename>')
def server_static(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    print("PlatePilot server running at http://localhost:5000")
    app.run(debug=True, port=5000)

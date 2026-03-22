from flask import Flask, request, jsonify, send_from_directory, render_template
import sqlite3
import sys
import os
from werkzeug.security import generate_password_hash, check_password_hash

# Add the directory containing PlatePilotUser.py to path
sys.path.insert(0, os.path.dirname(__file__))
from PlatePilotUser import ppuser

app = Flask(__name__)

# ── DATABASE PATH ─────────────────────────────────────────────────────────────
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'db_scripts', 'master_food.db')


# ── Serve HTML pages ──────────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('home.html')

@app.route('/<path:filename>')
def static_files(filename):
    if not filename.endswith('.html'):
        return "Not Found", 404
    return render_template(filename)


# ── API: REGISTER ─────────────────────────────────────────────────────────────
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()

    try:
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not name or not email or not password:
            return jsonify({'error': 'Missing required fields'}), 400

        hashed_password = generate_password_hash(password)

        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        cur.execute("""
        INSERT INTO users (name, email, password)
        VALUES (?, ?, ?)
        """, (name, email, hashed_password))

        conn.commit()
        user_id = cur.lastrowid
        conn.close()

        return jsonify({
            'message': 'User registered successfully',
            'user_id': user_id
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already exists'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ── API: Update user details by user_id ───────────────────────────────────────
@app.route('/api/update_user', methods=['POST'])
def update_user():
    data = request.get_json()

    try:
        user_id = data.get('user_id')          # primary key
        age = data.get('age')
        weight_lbs = data.get('weight_lbs')
        sex = data.get('sex')
        height_inches = data.get('height_inches')

        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        # Connect to DB
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        cur.execute("""
            UPDATE users
            SET age = ?, weight_lbs = ?, sex = ?, height_inches = ?
            WHERE id = ?
        """, (age, weight_lbs, sex, height_inches, user_id))

        conn.commit()
        conn.close()

        return jsonify({'message': 'User details updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/update_goal', methods=['POST'])
def update_goal():
    data = request.get_json()
    user_id = data.get('user_id')
    goal = data.get('goal')  # must be an integer 1, 2, or 3

    if not user_id or goal is None:
        return jsonify({'error': 'Missing user_id or goal'}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("""
            UPDATE users
            SET goal = ?
            WHERE id = ?
        """, (goal, user_id))
        conn.commit()
        conn.close()

        return jsonify({'message': 'Goal updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── API: LOGIN ────────────────────────────────────────────────────────────────
@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()

    try:
        email = data.get('email')
        password = data.get('password')

        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        cur.execute("SELECT id, password FROM users WHERE email = ?", (email,))
        user = cur.fetchone()

        conn.close()

        if user and check_password_hash(user[1], password):
            return jsonify({
                'message': 'Login successful',
                'user_id': user[0]
            }), 200
        else:
            return jsonify({'error': 'Invalid email or password'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── API: Calculate user DRI ───────────────────────────────────────────────────
@app.route('/api/dri', methods=['POST'])
def calculate_dri():
    data = request.get_json()
    try:
        user = ppuser(
            w=float(data['weight']),
            h=float(data['height']),
            a=int(data['age']),
            s=str(data['sex']),
            al=int(data['activity_level']),
            g=int(data['goal'])
        )
        user.setDRI()
        return jsonify({
            'macros': user.macros,
            'micros': user.micros,
            'BMR': round(user.BMR, 1),
            'TDEE': round(user.TDEE, 1)
        })
    except (KeyError, ValueError) as e:
        return jsonify({'error': str(e)}), 400


# ── API: Food search ──────────────────────────────────────────────────────────
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
            ff.description AS food_name,
            ff.category,
            n.name AS nutrient_name,
            ROUND(AVG(fn.amount), 2) AS avg_amount,
            n.unit_name AS unit
        FROM filtered_foods ff
        INNER JOIN food_nutrient fn ON ff.fdc_id = fn.fdc_id
        INNER JOIN nutrient n ON fn.nutrient_id = n.id
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


# ── RUN SERVER ────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("PlatePilot server running at http://localhost:5000")
    app.run(debug=True, port=5000)
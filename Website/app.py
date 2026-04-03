from flask import Flask, request, jsonify, send_from_directory, render_template
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import sys
import os
from uuid import uuid4

# Add the directory containing PlatePilotUser.py to path
dietTrackerfolderDir = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, dietTrackerfolderDir + "\\scripts")
from PlatePilotUser import ppuser
from buildQuery import connectDB
app = Flask(__name__)

# Helpers
def connect_to_database():
    conn = connectDB()
    return conn

def convert_lbs_to_kg(weight_lbs):
    weightKg = round(weight_lbs * 0.453592, 2)
    return weightKg

def convert_inches_to_cm(height_in):
    height_cm = round(height_in * 2.54, 2)
    return height_cm

def query_db_for_user_info(user_id, returnJSON=True):
    conn = None
    try:
        conn = connect_to_database()
        cur = conn.cursor()

        cur.execute("""
            SELECT name, email, age, sex, height_inches, weight_lbs, goal, activity_level, profile_picture
            FROM Users
            WHERE id = ?
        """, (user_id,))

        row = cur.fetchone()

        if not row:
            return jsonify({'error': 'User not found'}), 404

        name, email, age, sex, height_in, weight_lbs, goal, activity_level, profile_picture = row

        cur.execute("""
            SELECT r.name
            FROM UserRestrictions ur
            JOIN Restrictions r 
            ON ur.restrictionId = r.restrictionId
            WHERE ur.userId = ?
        """, (user_id,))

        restrictions = [r[0] for r in cur.fetchall()]
        if(returnJSON):
            return jsonify({
                'name': name,
                'email': email,
                'age': age,
                'sex': sex,
                'height_in': height_in,
                'weight_lbs': weight_lbs,
                'goal': goal,
                'activity_level': activity_level,
                'profile_picture': profile_picture,
                'restrictions': restrictions
            })
        else:
            return (name, email, age, sex, height_in, weight_lbs, goal, activity_level, profile_picture, restrictions)

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500

    finally:
       if conn: conn.close()


#Deliver HTML
@app.route('/')
def index():
    return render_template('home.html')

@app.route('/<path:filename>')
def html_urls(filename):
    if not filename.endswith('.html'):
        return "Not Found", 404
    return render_template(filename)


######### API METHODS #########

# Register
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    conn = None 

    try:
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not name or not email or not password:
            print("[ERROR]: Missing fields in POST request!")
            return jsonify({'error': 'Missing required fields'}), 400

        hashed_password = generate_password_hash(password)

        conn = connect_to_database()
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
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

#update user info
@app.route('/api/update_user', methods=['POST'])
def update_user():
    data = request.get_json()

    try:
        user_id = data.get('user_id')
        age = data.get('age')
        weight_lbs = data.get('weight_lbs')
        sex = data.get('sex')
        height_inches = data.get('height_in')
        goal = data.get('goal')
        activity_level = data.get('activity_level')
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        conn = connect_to_database()
        cur = conn.cursor()

        cur.execute("""
            UPDATE users
            SET age = ?, weight_lbs = ?, sex = ?, height_inches = ?, goal = ?, activity_level = ?, profile_picture = COALESCE(?, profile_picture)
            WHERE id = ?
        """, (age, weight_lbs, sex, height_inches, goal, activity_level, data.get('profile_picture'), user_id))

        conn.commit()
        conn.close()

        return jsonify({'message': 'User details updated successfully'}), 200

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

#Updates user goals
@app.route('/api/update_goal', methods=['POST'])
def update_goal():
    data = request.get_json()

    try:
        user_id = data.get('user_id')
        goal_id = data.get('goal_id')  # must be an integer 1, 2, or 3

        if not user_id or goal_id is None:
            return jsonify({'error': 'Missing user_id or goal'}), 400

        conn = connect_to_database()
        cur = conn.cursor()

        print(f"Goal is: {goal_id}")

        #update database
        cur.execute("""
            UPDATE users
            SET goal = ?
            WHERE id = ?
        """, (goal_id, user_id))
        conn.commit()
        conn.close()

        return jsonify({'message': 'Goal updated successfully'})

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

# Upload profile avatar
@app.route('/api/upload-avatar', methods=['POST'])
def upload_avatar():
    try:
        user_id = request.form.get('user_id')
        avatar_file = request.files.get('avatar')

        if not user_id or not avatar_file:
            return jsonify({'error': 'Missing user_id or avatar file'}), 400

        # Save file to static folder
        upload_dir = os.path.join(os.path.dirname(__file__), 'static', 'images', 'user_avatars')
        os.makedirs(upload_dir, exist_ok=True)

        ext = os.path.splitext(avatar_file.filename)[1]
        filename = f"user_{user_id}_{uuid4().hex}{ext}"
        filepath = os.path.join(upload_dir, filename)
        avatar_file.save(filepath)

        profile_picture_url = f"/static/images/user_avatars/{filename}"

        conn = connect_to_database()
        cur = conn.cursor()
        cur.execute("UPDATE Users SET profile_picture = ? WHERE id = ?", (profile_picture_url, user_id))
        conn.commit()
        conn.close()

        return jsonify({'message': 'Avatar uploaded', 'profile_picture': profile_picture_url}), 200

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500

#update user restrictions
@app.route("/set-restrictions", methods=["POST"])
def set_restrictions():
    data = request.get_json()
    print("Received JSON:", data)
    user_id = data["user_id"]
    restriction_names = data["restrictions"]

    conn = connect_to_database()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    try:
        if not restriction_names:
            # If empty, just clear user's restrictions
            cur.execute(
                "DELETE FROM UserRestrictions WHERE userId = ?",
                (user_id,)
            )
            conn.commit()
            return jsonify({"message": "Restrictions cleared"}), 200

        # 1. Get all matching restriction IDs in ONE query
        placeholders = ",".join(["?"] * len(restriction_names))

        cur.execute(
            f"""
            SELECT restrictionId, name
            FROM Restrictions
            WHERE name IN ({placeholders})
            """,
            restriction_names
        )

        rows = cur.fetchall()

        # 2. Validate (make sure all names exist)
        found_names = {row["name"] for row in rows}
        if set(restriction_names) != found_names:
            return jsonify({"error": "Invalid restriction detected"}), 400

        restriction_ids = [row["restrictionId"] for row in rows]

        # 3. Replace existing restrictions (cleanest)
        cur.execute(
            "DELETE FROM UserRestrictions WHERE userId = ?",
            (user_id,)
        )

        # 4. Insert new ones
        cur.executemany(
            """
            INSERT INTO UserRestrictions (userId, restrictionId)
            VALUES (?, ?)
            """,
            [(user_id, rid) for rid in restriction_ids]
        )

        conn.commit()
        return jsonify({"message": "Restrictions updated"}), 200

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()

#get user info 
@app.route('/api/get-user-info', methods=['GET'])
def get_user_info():
    try:
        user_id = int(request.args.get('user_id'))
        if not user_id:
            return jsonify({'error': 'Missing user_id'}), 400
        return query_db_for_user_info(user_id=user_id, returnJSON=True)
    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500

# user login
@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()

    try:
        email = data.get('email')
        password = data.get('password')

        conn = connect_to_database()
        cur = conn.cursor()

        cur.execute("SELECT id, password FROM users WHERE email = ?", (email,))
        user = cur.fetchone()

        if user and check_password_hash(user[1], password):
            return jsonify({
                'message': 'Login successful',
                'user_id': user[0]
            }), 200
        else:
            return jsonify({'error': 'Invalid email or password'}), 401

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

# Calculate DRI
@app.route('/api/dri', methods=['POST'])
def calculate_dri():
    data = request.get_json()
    try:
        user_id = data.get('user_id')
        (name, email, age, sex, height_in, weight_lbs, goal, activity_level, profile_picture, restrictions)=query_db_for_user_info(user_id=user_id, returnJSON=False)
        # convert height and weight to the correct units
        weight_kg = convert_lbs_to_kg(weight_lbs)
        height_cm = convert_inches_to_cm(height_in)
        
        user = ppuser(
            w=float(weight_kg),
            h=float(height_cm),
            a=int(age),
            s=str(sex),
            al=int(2),
            g=int(goal)
        )
        user.setDRI()
        return jsonify({
            'macros': user.macros,
            'micros': user.micros,
            'BMR': round(user.BMR, 1),
            'TDEE': round(user.TDEE, 1)
        })
    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 400

# Food Search
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
        conn = connect_to_database()
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute(sql, params)
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify(rows)
    except sqlite3.OperationalError as e:
        return jsonify({'error': str(e)}), 500

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

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
 
        if not rows:
            return jsonify({'error': 'Food not found'}), 404
 
        food_name = rows[0]['food_name']
        nutrients = { r['nutrient_name']: r['avg_amount'] for r in rows }
 
        return jsonify({ 'food_name': food_name, 'nutrients': nutrients })
 
    except sqlite3.OperationalError as e:
        return jsonify({'error': str(e)}), 500

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

# Log Food
@app.route('/api/log-food', methods=['POST'])
def log_food_entry():
    data = request.get_json()
    user_id = data.get('user_id')
    food_name = data.get('name')
    calories = data.get('kcal')

    if not user_id or not food_name or calories is None:
        return jsonify({'error': 'user_id, name, and kcal are required'}), 400

    conn = None
    try:
        conn = connect_to_database()
        cur = conn.cursor()

        # Get today's date
        from datetime import date
        today = date.today().isoformat()

        # Insert into FoodHistory
        cur.execute("""
            INSERT INTO FoodHistory (userId, foodName, calories, dateLogged)
            VALUES (?, ?, ?, ?)
        """, (user_id, food_name, calories, today))

        conn.commit()

        # Get total calories for today
        cur.execute("""
            SELECT SUM(calories) as total
            FROM FoodHistory
            WHERE userId = ? AND dateLogged = ?
        """, (user_id, today))

        result = cur.fetchone()
        total_calories = result[0] if result[0] else 0

        return jsonify({
            'message': 'Food logged successfully',
            'totalCalories': total_calories
        }), 201

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500

    finally:
        if conn: conn.close()

# Get Food History
@app.route('/api/food-history/<user_id>', methods=['GET'])
def get_food_history(user_id):
    conn = None
    try:
        conn = connect_to_database()
        cur = conn.cursor()

        cur.execute("""
            SELECT dateLogged, foodName, calories
            FROM FoodHistory
            WHERE userId = ?
            ORDER BY dateLogged DESC, timeLogged DESC
        """, (user_id,))

        rows = cur.fetchall()

        history = []
        for row in rows:
            history.append({
                'date': row[0],
                'name': row[1],
                'kcal': row[2]
            })

        return jsonify(history), 200

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500

    finally:
        if conn: conn.close()

#Run server
if __name__ == '__main__':
    print("PlatePilot server running at http://localhost:5000")
    app.run(debug=True, port=5000)
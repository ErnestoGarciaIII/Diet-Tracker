from flask import Flask, request, jsonify, send_from_directory, render_template, session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date, timedelta, timezone
import sqlite3
import secrets
import sys
import os
from uuid import uuid4

# Add the directory containing PlatePilotUser.py to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
scripts_path = os.path.join(parent_dir, 'scripts')
sys.path.append(scripts_path)

from PlatePilotUser import ppuser
from food_search import connectDB, apply_filter, clear_user_filters, search_engine
from the_holy_grail import recommend_foods, NUTRIENT_ID_TO_NAME
from send_email import send_reset_email


app = Flask(__name__)
app.secret_key = secrets.token_urlsafe(32)  # Needed for session support

active_user_filters = {}

def migrate_db():
    conn = None
    try:
        conn = connectDB()
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(Users)")
        columns = [row[1] for row in cur.fetchall()]
        if 'date_of_birth' not in columns:
            cur.execute("ALTER TABLE Users ADD COLUMN date_of_birth TEXT")
            conn.commit() 
    except Exception as e:
        print(f"[MIGRATION ERROR]: {e}")
    finally: 
        if conn:
            conn.close()

migrate_db()

def calculate_daily_progress(user_id, conn):
    cursor = conn.cursor()
    today = datetime.now().strftime('%a %b %d %Y')

    cursor.execute("""
        SELECT fdc_id, portion, gram_weight
        FROM FoodHistory
        WHERE userId = ? AND dateLogged = ?
    """, (user_id, today))

    history_rows = cursor.fetchall()
    if not history_rows:
        return {}

    total_grams_map = {row[0]: (row[1] * row[2]) for row in history_rows}
    fdc_ids = list(total_grams_map.keys())
    portions = {row[0]: row[1] for row in history_rows}

    fdc_placeholders = ",".join(map(str, fdc_ids))

    nutrient_query = f"""
    WITH selected_nutrients AS (
        SELECT id, name, unit_name
        FROM nutrient
        WHERE id IN (1003, 1005, 1004, 1106, 1162, 1114, 1175, 1109, 1185, 1165, 
                    1178, 1166, 1177, 1167, 1180, 1089, 1170, 1087, 1098, 1090, 
                    1101, 1091, 1092, 1103, 1093, 1079, 1095)
    ),
    selected_foods AS (
        SELECT DISTINCT fdc_id FROM food_nutrient WHERE fdc_id IN ({fdc_placeholders})
    ),
    energy AS (
        SELECT fdc_id, 'Energy' AS name,
            COALESCE (
                MAX(CASE WHEN nutrient_id = 1008 AND amount > 0 THEN amount / 100.0 END),
                MAX(CASE WHEN nutrient_id = 2047 AND amount > 0 THEN amount / 100.0 END),
                0.0
            ) AS adjusted_nutrient,
            'KCAL' AS unit_name
        FROM food_nutrient
        WHERE nutrient_id IN (1008, 2047)
        AND fdc_id IN (SELECT fdc_id FROM selected_foods)
        GROUP BY fdc_id
    )
    SELECT
        sf.fdc_id,
        sn.name,
        COALESCE(fn.amount / 100.0, 0.0) AS adjusted_nutrient
    FROM selected_foods sf
    CROSS JOIN selected_nutrients sn
    LEFT JOIN food_nutrient fn ON fn.fdc_id = sf.fdc_id AND fn.nutrient_id = sn.id
    UNION ALL
    SELECT fdc_id, name, adjusted_nutrient FROM energy
    ORDER BY fdc_id;
    """
    
    cursor.execute(nutrient_query)
    nutrient_rows = cursor.fetchall()
    
    for row in nutrient_rows:
        print(row)

    progress = {"Energy": 0.0}
    for row in nutrient_rows:
        # debug print(row)
        nutrient_name = row[1]
        if nutrient_name not in progress:
            progress[nutrient_name] = 0.0

    for fdc_id, nutrient_name, adjusted_amount in nutrient_rows:
        total_grams = total_grams_map.get(fdc_id, 0.0)
        progress[nutrient_name] += adjusted_amount * total_grams

    return progress


# Helpers
def generate_reset_token():
    return secrets.token_urlsafe(32)

def get_expiry(minutes=30):
    return (getCurrentTimeUTC() + timedelta(minutes=minutes)).isoformat()

def getCurrentTimeUTC():
    return datetime.now(timezone.utc)

def hash_password(password):
    return generate_password_hash(password)

def convert_lbs_to_kg(weight_lbs):
    weightKg = round(weight_lbs * 0.453592, 2)
    return weightKg

def convert_inches_to_cm(height_in):
    height_cm = round(height_in * 2.54, 2)
    return height_cm

def calculate_age(dob_str: str) -> int:
    if not dob_str: return 0

    dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
    today = date.today()

    age = today.year - dob.year

    # subtract 1 if birthday hasn't happened yet this year
    if (today.month, today.day) < (dob.month, dob.day):
        age -= 1

    return age

def query_db_for_user_info(user_id, returnJSON=True):
    conn = None
    try:
        conn = connectDB()
        cur = conn.cursor()

        cur.execute("""
            SELECT name, email, sex, height_inches, weight_lbs, goal, activity_level, profile_picture, date_of_birth, account_creation_date
            FROM Users
            WHERE userId = ?
        """, (user_id,))

        row = cur.fetchone()

        if not row:
            return jsonify({'error': 'User not found'}), 404

        name, email, sex, height_in, weight_lbs, goal, activity_level, profile_picture, DOB, account_creation_date_utc = row

        cur.execute("""
            SELECT r.name
            FROM UserRestrictions ur
            JOIN Restrictions r 
            ON ur.restrictionId = r.restrictionId
            WHERE ur.userId = ?
        """, (user_id,))

        restrictions = [r[0] for r in cur.fetchall()]
        age = calculate_age(DOB)

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
                'date_of_birth': DOB,
                'account_creation_date_utc': account_creation_date_utc,
                'restrictions': restrictions
            })
        else:
            return (name, email, age, sex, height_in, weight_lbs, goal, activity_level, profile_picture, restrictions, account_creation_date_utc)

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

        currentDateTime = getCurrentTimeUTC()

        if not name or not email or not password:
            print("[ERROR]: Missing fields in POST request!")
            return jsonify({'error': 'Missing required fields'}), 400

        hashedPassword = hash_password(password)

        conn = connectDB()
        cur = conn.cursor()

        cur.execute("""
        INSERT INTO users (name, email, password, account_creation_date)
        VALUES (?, ?, ?, ?)
        """, (name, email, hashedPassword, currentDateTime))

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

@app.route('/reset-password', methods=['GET'])
def reset_password():
    token = request.args.get('token')
    return render_template('resetPassword.html', token=token)

#update user info
@app.route('/api/update_user', methods=['POST'])
def update_user():
    conn = None
    data = request.get_json()

    if data is None:
        return jsonify({'error': 'Invalid JSON payload'}), 400

    try:
        user_id = data.get('user_id')
        date_of_birth = data.get('DOB')
        weight_lbs = data.get('weight_lbs')
        sex = data.get('sex')
        height_inches = data.get('height_in')
        goal = data.get('goal')
        activity_level = data.get('activity_level')
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        conn = connectDB()
        cur = conn.cursor()

        # Handle profile_picture separately - allow explicit None to remove
        profile_picture = data.get('profile_picture')
        if profile_picture is None and 'profile_picture' in data:
            # User explicitly set to None, remove the picture
            cur.execute("""
                UPDATE users
                SET name = COALESCE(?, name), email = COALESCE(?, email), weight_lbs = ?, sex = ?, height_inches = ?, goal = ?, activity_level = ?, profile_picture = NULL, date_of_birth = COALESCE(?, date_of_birth)
                WHERE userId = ?
            """, (data.get('name'), data.get('email'),  weight_lbs, sex, height_inches, goal, activity_level, date_of_birth, user_id))
        else:
            # Normal update with or without profile_picture
            cur.execute("""
                UPDATE users
                SET name = COALESCE(?, name), email = COALESCE(?, email),  weight_lbs = ?, sex = ?, height_inches = ?, goal = ?, activity_level = ?, profile_picture = COALESCE(?, profile_picture), date_of_birth = COALESCE(?, date_of_birth)
                WHERE userId = ?
            """, (data.get('name'), data.get('email'), weight_lbs, sex, height_inches, goal, activity_level, data.get('profile_picture'), date_of_birth, user_id))

        conn.commit()

        return jsonify({'message': 'User details updated successfully'}), 200

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500
    
    finally:
        if conn:
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

        conn = connectDB()
        cur = conn.cursor()

        print(f"Goal is: {goal_id}")

        #update database
        cur.execute("""
            UPDATE users
            SET goal = ?
            WHERE userId = ?
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

        conn = connectDB()
        cur = conn.cursor()
        cur.execute("UPDATE Users SET profile_picture = ? WHERE userId = ?", (profile_picture_url, user_id))
        conn.commit()
        conn.close()

        return jsonify({'message': 'Avatar uploaded', 'profile_picture': profile_picture_url}), 200


    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500


@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    conn = None
    try:
        data = request.json
        email = data.get('email')

        conn = connectDB()
        cur = conn.cursor()
        cur.execute("SELECT userId FROM users WHERE email = ?", (email,))
        userId = cur.fetchone()

        # Always return same message (security best practice)
        if not userId:
            return jsonify({'message': 'If an account exists, a reset link has been sent'}), 200

        resetToken = generate_reset_token()
        expiry = get_expiry(30)

        cur.execute("""
            UPDATE users
            SET reset_token = ?, reset_token_expiry = ?
            WHERE email = ?
        """, (resetToken, expiry, email))

        conn.commit()

        resetLink = f"http://localhost:5000/reset-password?token={resetToken}"
        send_reset_email(email, resetLink)
        print("RESET LINK:", resetLink)

        return jsonify({'message': 'If an account exists, a reset link has been sent'}), 200

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500

    finally:
        if conn: conn.close()

@app.route('/api/reset-password', methods=['POST'])
def reset_password_api():
    conn = None
    try:
        data = request.json
        resetToken = data.get('token')
        newPassword = data.get('newPassword')

        conn = connectDB()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT userId, reset_token_expiry FROM Users
            WHERE reset_token = ?
        """, (resetToken,))

        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'Invalid token'}), 400

        user_id, expiry = user

        if not expiry:
            return jsonify({'message': 'Token expired'}), 400

        hashedPassword = hash_password(newPassword)

        cursor.execute("""
            UPDATE Users
            SET password = ?, reset_token = NULL, reset_token_expiry = NULL
            WHERE userId = ?
        """, (hashedPassword, user_id))

        conn.commit()

        return jsonify({'message': 'Password reset successful'}), 200

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500

    finally:
        if conn: conn.close()

#update user restrictions
@app.route("/set-restrictions", methods=["POST"])
def set_restrictions():
    data = request.get_json()
    print("Received JSON:", data)
    user_id = data["user_id"]
    restriction_names = data["restrictions"]

    conn = connectDB()
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

        conn = connectDB()
        cur = conn.cursor()

        cur.execute("SELECT userId, password FROM users WHERE email = ?", (email,))
        user = cur.fetchone()

        if user and check_password_hash(user[1], password):
            session['user_id'] = user[0]
            session['logged_in'] = True
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


# API to check session status
@app.route('/api/session', methods=['GET'])
def check_session():
    user_id = session.get('user_id')
    logged_in = session.get('logged_in', False)
    return jsonify({'logged_in': logged_in, 'user_id': user_id})

# Calculate DRI
@app.route('/api/dri', methods=['POST'])
def calculate_dri():
    data = request.get_json()
    try:
        user_id = data.get('user_id')
        (_, _, age, sex, height_in, weight_lbs, goal, _, _, _, _)=query_db_for_user_info(user_id=user_id, returnJSON=False)
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
    
# Logout endpoint to clear session
@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'}), 200

# Food Search
NUTRIENT_IDS = [
    1106, 1162, 1114, 1175, 1158, 1079, 1109, 1185, 1165, 1178,
    1166, 1177, 1167, 1180, 1089, 1170, 1176, 1087, 1096, 1098,
    1099, 1100, 1238, 1090, 1101, 1102, 1091, 1092, 1103, 1093, 1095
]

@app.route('/api/clear-filters', methods=['POST'])
def clear_those_filters():
    data = request.get_json()
    try:
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({'error': 'User ID required to maintain session'}), 400

        print(f"Removing all active filters for user: {user_id}")

        if not user_id in active_user_filters:
            active_user_filters[user_id] = set()

        clear_user_filters(user_id, active_user_filters)
        if(user_id in active_user_filters):
            print(f"user filters: {active_user_filters[user_id]}")
        else:
            print("FILTERS CLEARED")
        return jsonify({
            'message': 'Filter cleared successfully',
            'user_Id': user_id,
            'result': 'success'
        }), 201
    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 400

@app.route('/api/get-filters', methods=['GET'])
def get_filters():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID required to maintain session'}), 400

        if not user_id in active_user_filters:
            active_user_filters[user_id] = set()
        print(active_user_filters[user_id])
        return jsonify({f'filters': f'{active_user_filters[user_id]}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/apply-filter', methods=['POST'])
def apply_that_filter():
    data = request.get_json()
    try:
        user_id = data.get('user_id')
        restriction = data.get('restriction')
        
        if not restriction:
            return jsonify({'error': 'Restriction is required to set a filter'}), 400

        if not user_id:
            return jsonify({'error': 'User ID required to maintain session'}), 400

        conn = connectDB()
        cur = conn.cursor()

        cur.execute("""
            SELECT restrictionId
            FROM Restrictions
            WHERE name = ?
        """, (restriction,))
        
        restrictionId = cur.fetchone()

        print(f"Applying filter: {restriction} RestrictionId: {restrictionId[0]}")

        if not user_id in active_user_filters:
            active_user_filters[user_id] = set()

        apply_filter(restrictionId[0], conn, active_user_filters[user_id])

        return jsonify({
            'message': 'Filter set successfully',
            'filterId': restrictionId,
            'result': 'success'
        }), 201
    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 400


@app.route('/api/search-engine', methods=['GET'])
def execute_search_engine():
    user_id = request.args.get('user_id')
    food_name = request.args.get('name')
    
    if not user_id:
        return jsonify({'error': 'User ID required to maintain session'}), 400

    if not user_id in active_user_filters:
        active_user_filters[user_id] = set()

    conn = connectDB() 

    if not food_name:
        return jsonify({'error': 'No string received'}), 400

    try:
        results = search_engine(food_name, conn, active_user_filters[user_id])
        return jsonify(results), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-modifiers', methods=['GET'])
def get_modifiers():
    print("ENTERED GET MODIFIERS :) ")
    fdc_id = request.args.get('fdc_id')
    if not fdc_id:
        return jsonify({'error': 'fdc_id not pass properly'}), 400

    conn = None
    try:
        conn = connectDB()
        cur = conn.cursor()

        cur.execute("""
        SELECT
            COALESCE(gram_weight/amount, 1.0) AS gram_weight,
            COALESCE(modifier, "g") AS modifier
        FROM (SELECT 1) AS default_row
            LEFT JOIN food_portion fp
            ON fdc_id = ?
        """, (fdc_id,))

        results = cur.fetchall()
        print(fdc_id)
        print(results)
        

        return jsonify({
            'modifiers': results
        }), 200
    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()


# Get Nutrients of Food
@app.route('/api/get-nutrients', methods=['GET'])
def get_nutrients():
    fdc_id = request.args.get('fdc_id')
    
    if not fdc_id:
        return jsonify({'error': 'fdc_id is required'}), 400
    
    conn = None
    try:
        conn = connectDB()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT fn.amount, n.name
            FROM food_nutrient fn
            JOIN nutrient n ON fn.nutrient_id = n.id
            WHERE fn.fdc_id = ? AND n.name = 'Energy'
        """, (fdc_id,))
        
        result = cur.fetchone()
        
        return jsonify({
            'fdc_id': fdc_id
        }), 200
        
    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500
    
    finally:
        if conn:
            conn.close()

# Log Food
@app.route('/api/log-food', methods=['POST'])
def log_food_entry():
    data = request.get_json()
    user_id = data.get('user_id')
    items = data.get('items', [])

    if not user_id: 
        return jsonify({'error': 'User ID not passed'}), 400
    if not items or not isinstance(items, list):
        return jsonify({'error': 'items must be a non-empty list'}), 400

    conn = None
    try:
        conn = connectDB()
        cur = conn.cursor()

        today = datetime.now().strftime('%a %b %d %Y')  # Format like "Wed Apr 02 2026"

        rows = []
        for item in items:
            fdc_id	= item.get('fdc_id')
            name	= item.get('name')
            portion	= item.get('portion', 1)
            unit	= item.get('unit', 'g')
            gram_weight	= item.get('gram_weight', 1)
            meal_tag	= item.get('meal_tag')

            if not fdc_id or not name:
                return jsonify({'error': f'Each item requires fdc_id and name. Bad item: {item}'}), 400

            rows.append((user_id, fdc_id, name, today, portion, unit, gram_weight, meal_tag))

        cur.executemany("""
            INSERT INTO FoodHistory (userId, fdc_id, foodName, dateLogged, portion, unit, gram_weight, mealTag)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, rows)

        conn.commit()
        print("Entering recommendation algorithm...") 
        recommendations = recommendation_algorithm(user_id) 
        return jsonify({
            'message': f'{len(rows)} food(s) logged successfully',
            'result': 'success'
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
        conn = connectDB()
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        cur.execute("""
            SELECT id, fdc_id, foodName as name, dateLogged as date, portion, unit, gram_weight, mealTag
            FROM FoodHistory
            WHERE userId = ?
            ORDER BY id DESC
        """, (user_id,))

        rows = cur.fetchall()
        return jsonify([dict(row) for row in rows]), 200
    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500

    finally:
        if conn: conn.close()

# Get Progress
@app.route('/api/progress/<user_id>', methods=['GET'])
def get_progress(user_id):
    conn = None
    try:
        conn = connectDB()
        progress = calculate_daily_progress(user_id, conn)
        return jsonify(progress), 200

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500

    finally:
        if conn: conn.close()

# Update Food Entry
@app.route('/api/food-history/<int:entry_id>', methods=['PUT'])
def update_food_entry(entry_id):
    data = request.get_json()
    food_name = data.get('name')
    user_id = data.get('user_id')
    portion = data.get('portion', 1)

    if not food_name or not user_id:
        return jsonify({'error': 'name and user_id are required'}), 400

    conn = None
    try:
        conn = connectDB()
        cur = conn.cursor()

        # Update the food entry
        cur.execute("""
            UPDATE FoodHistory
            SET foodName = ?, portion = ?
            WHERE id = ? AND userId = ?
        """, (food_name, portion, entry_id, user_id))

        if cur.rowcount == 0:
            return jsonify({'error': 'Food entry not found or not authorized'}), 404

        conn.commit()

        cur.execute("""
            SELECT dateLogged FROM FoodHistory WHERE id = ?
        """, (entry_id,))
        
        date_row = cur.fetchone()
        if date_row:
            
            result = cur.fetchone()

        return jsonify({
            'message': 'Food entry updated successfully',
        }), 200

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500

    finally:
        if conn: conn.close()

# Delete Food Entry
@app.route('/api/food-history/<int:entry_id>', methods=['DELETE'])
def delete_food_entry(entry_id):
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    conn = None
    try:
        conn = connectDB()
        cur = conn.cursor()

        # Get the date before deleting for total calculation
        cur.execute("""
            SELECT dateLogged FROM FoodHistory WHERE id = ? AND userId = ?
        """, (entry_id, user_id))
        
        date_row = cur.fetchone()
        if not date_row:
            return jsonify({'error': 'Food entry not found or not authorized'}), 404

        date_logged = date_row[0]

        # Delete the food entry
        cur.execute("""
            DELETE FROM FoodHistory
            WHERE id = ? AND userId = ?
        """, (entry_id, user_id))

        if cur.rowcount == 0:
            return jsonify({'error': 'Food entry not found or not authorized'}), 404

        conn.commit()


        result = cur.fetchone()
        return jsonify({
            'message': 'Food entry deleted successfully',
        }), 200

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500

    finally:
        if conn: conn.close()

# Clear All Food History
@app.route('/api/food-history/clear/<user_id>', methods=['DELETE'])
def clear_food_history(user_id):
    conn = None
    try:
        conn = connectDB()
        cur = conn.cursor()

        # Delete all food history for the user
        cur.execute("""
            DELETE FROM FoodHistory
            WHERE userId = ?
        """, (user_id,))

        deleted_count = cur.rowcount
        conn.commit()

        return jsonify({
            'message': f'Cleared {deleted_count} food entries successfully'
        }), 200

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500

    finally:
        if conn: conn.close()

def recommendation_algorithm(user_id):
    
    conn = None

    try:
        conn = connectDB()
        (_, _, age, sex, height_in, weight_lbs,
         goal, activity_level, _, _, _) = query_db_for_user_info(
            user_id=user_id, returnJSON=False
        )

        user_info = query_db_for_user_info(user_id=user_id, returnJSON=False)
        print(user_info)
        user_object = ppuser(
            w=convert_lbs_to_kg(user_info[5]),
            h=convert_inches_to_cm(user_info[4]),
            a=int(user_info[2]),
            s=str(user_info[3]),
            al=int(user_info[7]),
            g=int(user_info[6])
        )
        user_object.setDRI()
        
        translation_map = {
            "Protein": "Protein",
            "Total lipid (fat)": "Fats",
            "Carbohydrate, by difference": "Carbs",
            "Fiber, total dietary": "Fiber",
            "Calcium, Ca": "Calcium",
            "Iron, Fe": "Iron",
            "Magnesium, Mg": "Magnesium",
            "Phosphorus, P": "Phosphorus",
            "Potassium, K": "Potassium",
            "Sodium, Na": "Sodium",
            "Zinc, Zn": "Zinc",
            "Copper, Cu": "Copper",
            "Manganese, Mn": "Manganese",
            "Selenium, Se": "Selenium",
            "Vitamin A, RAE": "Vitamin A",
            "Vitamin E (alpha-tocopherol)": "Vitamin E",
            "Vitamin D (D2 + D3)": "Vitamin D",
            "Vitamin C, total ascorbic acid": "Vitamin C",
            "Thiamin": "Thiamin",
            "Riboflavin": "Riboflavin",
            "Niacin": "Niacin",
            "Pantothenic acid": "Pantothenic acid",
            "Vitamin B-6": "Vitamin B-6",
            "Folate, total": "Folate",
            "Vitamin B-12": "Vitamin B-12",
            "Choline, total": "Choline",
            "Vitamin K (phylloquinone)": "Vitamin K"
        }
        standardized_consumed = {}
        
        consumed_data = calculate_daily_progress(user_id, conn)

        for fdc_name, value in consumed_data.items():
            # Use the map to get the short name; default to fdc_name if not found
            clean_name = translation_map.get(fdc_name, fdc_name)
            standardized_consumed[clean_name] = value
        
        for index in standardized_consumed:
            user_object.getNutrientInfo(index)
            print(f"{index}: {standardized_consumed[index]}")

        user_filter_ids = list(active_user_filters.get(str(user_id), set()))
        
        recommendations = recommend_foods(user_object, conn, standardized_consumed, restriction_ids=user_filter_ids)
        print("\nDebug Recommendation \n------------------------------")
        for item in recommendations:
            # iteration: 1 -> "1."
            # name: 'Garlic, raw' -> "Garlic, raw"
            print(f"{item['iteration']}. {item['name']} Suggested Serving: {item['suggested_serving_oz']} oz (Match Score: {item['score']})")
            print("--------------------------------\n")
        
        print(standardized_consumed)
        
        return recommendations

    except Exception as e:
        print(f"Error: {e}")
        return 0

    finally:
        if conn: conn.close()


if __name__ == '__main__':
    print("PlatePilot server running at http://localhost:5000")
    app.run(debug=True, port=5000)

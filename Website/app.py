import sqlite3
import sys
import os
import secrets
from uuid import uuid4
from datetime import datetime, timedelta, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, request, jsonify, send_from_directory, render_template

# Add the directory containing PlatePilotUser.py to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
scripts_path = os.path.join(parent_dir, 'scripts')
sys.path.append(scripts_path)

from PlatePilotUser import ppuser
from food_search import connectDB, apply_filter, active_filters, search_engine
from send_email import send_reset_email

app = Flask(__name__)

active_user_conns = {}

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

# Helpers
def convert_lbs_to_kg(weight_lbs):
    weightKg = round(weight_lbs * 0.453592, 2)
    return weightKg

def convert_inches_to_cm(height_in):
    height_cm = round(height_in * 2.54, 2)
    return height_cm

def query_db_for_user_info(user_id, returnJSON=True):
    conn = None
    try:
        conn = connectDB()
        cur = conn.cursor()

        cur.execute("""
            SELECT name, email, age, sex, height_inches, weight_lbs, goal, activity_level, profile_picture, date_of_birth
            FROM Users
            WHERE userId = ?
        """, (user_id,))

        row = cur.fetchone()

        if not row:
            return jsonify({'error': 'User not found'}), 404

        name, email, age, sex, height_in, weight_lbs, goal, activity_level, profile_picture, date_of_birth = row

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
                'date_of_birth': date_of_birth,
                'restrictions': restrictions
            })
        else:
            return (name, email, age, sex, height_in, weight_lbs, goal, activity_level, profile_picture, date_of_birth, restrictions)

    except Exception as e:
        print("[ERROR]: ", e)
        return jsonify({'error': str(e)}), 500

    finally:
       if conn: conn.close()

def generate_reset_token():
    return secrets.token_urlsafe(32)

def get_expiry(minutes=30):
    return (getCurrentTimeUTC() + timedelta(minutes=minutes)).isoformat()

def getCurrentTimeUTC():
    return datetime.now(timezone.utc) 

def hash_password(password):
    return generate_password_hash(password)


#Deliver HTML
@app.route('/')
def index():
    return render_template('home.html')

@app.route('/<path:filename>')
def html_urls(filename):
    if not filename.endswith('.html'):
        return "Not Found", 404
    return render_template(filename)

@app.route('/reset-password', methods=['GET'])
def reset_password():
    if request.method == 'GET':
        token = request.args.get('token')
        return render_template('resetPassword.html', token=token)


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

        hashedPassword = hash_password(password)

        conn = connectDB()
        cur = conn.cursor()

        cur.execute("""
        INSERT INTO users (name, email, password)
        VALUES (?, ?, ?)
        """, (name, email, hashedPassword))

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

# forgot password
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.json
        email = data.get('email')

        conn = connectDB()
        cur = conn.cursor()
        cur.execute("SELECT userId FROM users WHERE email = ?", (email,))
        userId = cur.fetchone()

        # Always return same message (security)
        if not userId:
            return jsonify({'message': 'If an account exists, a reset link has been sent'}), 200

        resetToken = generate_reset_token()
        expiry = get_expiry(30)  # expires in 30 min
    
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
        if conn:
            conn.close()

# Change password
from datetime import datetime
@app.route('/api/reset-password', methods=['POST'])
def reset_password_api():
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

        if not expiry: #or datetime.fromisoformat(expiry) < getCurrentTimeUTC():
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
        if conn:
            conn.close()

#update user info
@app.route('/api/update_user', methods=['POST'])
def update_user():
    conn = None
    data = request.get_json()

    if data is None:
        return jsonify({'error': 'Invalid JSON payload'}), 400

    try:
        user_id = data.get('user_id')
        age = data.get('age')
        weight_lbs = data.get('weight_lbs')
        sex = data.get('sex')
        height_inches = data.get('height_in')
        goal = data.get('goal')
        activity_level = data.get('activity_level')
        date_of_birth = data.get('date_of_birth')
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
                SET name = COALESCE(?, name), email = COALESCE(?, email), age = ?, weight_lbs = ?, sex = ?, height_inches = ?, goal = ?, activity_level = ?, profile_picture = NULL, date_of_birth = COALESCE(?, date_of_birth)
                WHERE userId = ?
            """, (data.get('name'), data.get('email'), age, weight_lbs, sex, height_inches, goal, activity_level, date_of_birth, user_id))
        else:
            # Normal update with or without profile_picture
            cur.execute("""
                UPDATE users
                SET name = COALESCE(?, name), email = COALESCE(?, email), age = ?, weight_lbs = ?, sex = ?, height_inches = ?, goal = ?, activity_level = ?, profile_picture = COALESCE(?, profile_picture), date_of_birth = COALESCE(?, date_of_birth)
                WHERE userId = ?
            """, (data.get('name'), data.get('email'), age, weight_lbs, sex, height_inches, goal, activity_level, data.get('profile_picture'), date_of_birth, user_id))

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
        (name, email, age, sex, height_in, weight_lbs, goal, activity_level, profile_picture, date_of_birth, restrictions)=query_db_for_user_info(user_id=user_id, returnJSON=False)
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

        if user_id not in active_user_conns:
            active_user_conns[user_id] = connectDB()

        conn = active_user_conns[user_id]
        cur = conn.cursor()

        cur.execute("""
            SELECT restrictionId
            FROM Restrictions
            WHERE name = ?
        """, (restriction,))
        
        restrictionId = cur.fetchone()
        print(f"Applying filter: ${restriction} RestrictionId: ${restrictionId[0]}")

        apply_filter(restrictionId[0], conn)

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
    filters_str = request.args.get('filters', '')
    
    if not user_id:
        return jsonify({'error': 'User ID required to maintain session'}), 400

    if user_id not in active_user_conns:
        active_user_conns[user_id] = connectDB()

    conn = active_user_conns[user_id]

    if not food_name:
        return jsonify({'error': 'No string received'}), 400

    try:
        results = search_engine(food_name, conn)
        return jsonify(results), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
        
        # Get calories
        cur.execute("""
            SELECT fn.amount, n.name
            FROM food_nutrient fn
            JOIN nutrient n ON fn.nutrient_id = n.id
            WHERE fn.fdc_id = ? AND n.name = 'Energy'
        """, (fdc_id,))
        
        result = cur.fetchone()
        calories = result[0] if result else None
        
        return jsonify({
            'calories': calories,
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
    food_name = data.get('name')
    calories = data.get('kcal')
    portion = data.get('portion', 1)


    if not user_id or not food_name or calories is None:
        return jsonify({'error': 'user_id, name, and kcal are required'}), 400

    conn = None
    try:
        conn = connectDB()
        cur = conn.cursor()

        # Get today's date in the same format as frontend (toDateString)
        from datetime import datetime
        today = datetime.now().strftime('%a %b %d %Y')  # Format like "Wed Apr 02 2026"

        # Insert into FoodHistory
        cur.execute("""
            INSERT INTO FoodHistory (userId, foodName, calories, dateLogged, portion)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, food_name, calories, today, portion))

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
        conn = connectDB()
        cur = conn.cursor()

        cur.execute("""
            SELECT id, dateLogged, foodName, calories, portion
            FROM FoodHistory
            WHERE userId = ?
            ORDER BY dateLogged DESC, timeLogged DESC
        """, (user_id,))

        rows = cur.fetchall()

        history = []
        for row in rows:
            history.append({
                'id': row[0],
                'date': row[1],
                'name': row[2],
                'kcal': row[3],
                'portion': row[4] if row[4] is not None else 1  # Default portion to 1 if null
            })

        return jsonify(history), 200

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
        from datetime import datetime
        conn = connectDB()
        cur = conn.cursor()
        today = datetime.now().strftime('%a %b %d %Y')

        cur.execute("""
            SELECT SUM(calories) as total
            FROM FoodHistory
            WHERE userId = ? AND dateLogged = ?
        """, (user_id, today))

        result = cur.fetchone()
        total_calories = result[0] if result and result[0] else 0

        return jsonify({'calories': total_calories}), 200

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
    calories = data.get('kcal')
    user_id = data.get('user_id')
    portion = data.get('portion', 1)

    if not food_name or calories is None or not user_id:
        return jsonify({'error': 'name, kcal, and user_id are required'}), 400

    conn = None
    try:
        conn = connectDB()
        cur = conn.cursor()

        # Update the food entry
        cur.execute("""
            UPDATE FoodHistory
            SET foodName = ?, calories = ?, portion = ?
            WHERE id = ? AND userId = ?
        """, (food_name, calories, portion, entry_id, user_id))

        if cur.rowcount == 0:
            return jsonify({'error': 'Food entry not found or not authorized'}), 404

        conn.commit()

        # Get updated total calories for the day
        cur.execute("""
            SELECT dateLogged FROM FoodHistory WHERE id = ?
        """, (entry_id,))
        
        date_row = cur.fetchone()
        if date_row:
            cur.execute("""
                SELECT SUM(calories) as total
                FROM FoodHistory
                WHERE userId = ? AND dateLogged = ?
            """, (user_id, date_row[0]))
            
            result = cur.fetchone()
            total_calories = result[0] if result[0] else 0
        else:
            total_calories = 0

        return jsonify({
            'message': 'Food entry updated successfully',
            'totalCalories': total_calories
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

        # Get updated total calories for the day
        cur.execute("""
            SELECT SUM(calories) as total
            FROM FoodHistory
            WHERE userId = ? AND dateLogged = ?
        """, (user_id, date_logged))

        result = cur.fetchone()
        total_calories = result[0] if result[0] else 0

        return jsonify({
            'message': 'Food entry deleted successfully',
            'totalCalories': total_calories
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


#Run server
if __name__ == '__main__':
    print("PlatePilot server running at http://localhost:5000")
    app.run(debug=True, port=5000)

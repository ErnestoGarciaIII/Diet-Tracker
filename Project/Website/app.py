from flask import Flask, request, jsonify
from flask_cors import CORS 
import sqlite3

app = Flask(__name__)
CORS(app) # This allows the HTML files to talk to the Python server

def get_db_connection():
    conn = sqlite3.connect('platepilot.db')
    conn.row_factory = sqlite3.Row
    return conn

# Register (from register.html)
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
                     (data['fullName'], data['email'], data['password']))
        conn.commit()
        return jsonify({"status": "success"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already exists"}), 400
    finally:
        conn.close()
        
# Update Biometrics (from userInfo.html)
@app.route('/update_bio', methods=['POST'])
def update_bio():
    data = request.json
    conn = get_db_connection()
    # This captures the 'gender' string sent from the radio button logic
    conn.execute('''
        UPDATE users SET age = ?, weight = ?, height = ?, gender = ? 
        WHERE email = ?''', 
        (data['age'], data['weight'], data['height'], data['gender'], data['email']))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

# Gets the  User Data (for settings.html)
@app.route('/get_user/<email>', methods=['GET'])
def get_user(email):
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    if user:
        return jsonify(dict(user))
    return jsonify({"error": "User not found"}), 404

# checks 
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    # Query the database for the user with this email
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()

    if user:
        # Checks if the password matches the one stored in the DB
        if user['password'] == password:
            return jsonify({
                "status": "success",
                "fullName": user['full_name']
            }), 200
        else:
            return jsonify({"error": "Incorrect password"}), 401
    
    # If no user was found with that email
    return jsonify({"error": "Account not found"}), 404

if __name__ == '__main__':
    app.run(port=5000, debug=True)
    

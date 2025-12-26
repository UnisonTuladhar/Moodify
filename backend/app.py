from flask import Flask, request, jsonify
from flask_cors import CORS
from config import get_db_connection
import hashlib
import random
from flask_mail import Mail, Message 

app = Flask(__name__)
CORS(app)

#  MAIL CONFIGURATION PART
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = 'tuladharunison@gmail.com' 
app.config['MAIL_PASSWORD'] = 'wxke isfd qwpb yevk'   
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True

mail = Mail(app)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def generate_otp():
    return str(random.randint(100000, 999999))

# Registration
@app.post("/register-step1")
def register_step1():
    data = request.json
    username = data["username"]
    email = data["email"]
    password = hash_password(data["password"])
    otp = generate_otp()

    db = get_db_connection()
    cursor = db.cursor()

    try:
        # Check if email exists
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            if existing_user[4] == 0: 
                 cursor.execute("UPDATE users SET username=%s, password=%s, otp=%s WHERE email=%s", 
                                (username, password, otp, email))
            else:
                return jsonify({"error": "Email already registered and verified!"}), 400
        else:
            cursor.execute("INSERT INTO users (username, email, password, otp, is_verified) VALUES (%s, %s, %s, %s, 0)",
                           (username, email, password, otp))
        
        db.commit()

        msg = Message('Moodify Verification Code', sender='tuladharunison@gmail.com', recipients=[email])
        msg.body = f"Your verification code is: {otp}"
        mail.send(msg)

        return jsonify({"message": "OTP sent to your email!"}), 200
    except Exception as e:
        print(e) 
        return jsonify({"error": str(e)}), 500 

# REGISTER Verification
@app.post("/verify-registration")
def verify_registration():
    data = request.json
    email = data["email"]
    user_otp = data["otp"]

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM users WHERE email=%s AND otp=%s", (email, user_otp))
    user = cursor.fetchone()

    if user:
        cursor.execute("UPDATE users SET is_verified=1, otp=NULL WHERE email=%s", (email,))
        db.commit()
        return jsonify({"message": "Account verified successfully!"}), 201
    else:
        return jsonify({"error": "Invalid OTP!"}), 400

# LOGIN 
@app.post("/login")
def login():
    data = request.json
    email = data["email"]
    password = hash_password(data["password"])

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM users WHERE email=%s AND password=%s", (email, password))
    user = cursor.fetchone()

    if user:
        return jsonify({"message": "Login successful!"}), 200
    else:
        return jsonify({"error": "Invalid email or password!"}), 401

# FORGOT PASSWORD
@app.post("/forgot-password")
def forgot_password():
    data = request.json
    email = data["email"]
    otp = generate_otp()

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
    user = cursor.fetchone()

    if user:
        cursor.execute("UPDATE users SET otp=%s WHERE email=%s", (otp, email))
        db.commit()

        msg = Message('Moodify Password Reset', sender='tuladharunison@gmail.com', recipients=[email])
        msg.body = f"Your OTP for password reset is: {otp}"
        mail.send(msg)
        
        return jsonify({"message": "OTP sent to your email!"}), 200
    else:
        return jsonify({"error": "Email not found!"}), 404

# Reset Password
@app.post("/reset-password")
def reset_password():
    data = request.json
    email = data["email"]
    otp = data["otp"]
    new_password = hash_password(data["new_password"])

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM users WHERE email=%s AND otp=%s", (email, otp))
    user = cursor.fetchone()

    if user:
        cursor.execute("UPDATE users SET password=%s, otp=NULL WHERE email=%s", (new_password, email))
        db.commit()
        return jsonify({"message": "Password updated successfully!"}), 200
    else:
        return jsonify({"error": "Invalid OTP!"}), 400

app.run(debug=True)


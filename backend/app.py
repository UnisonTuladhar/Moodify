from flask import Flask, request, jsonify, Response, send_from_directory 
from flask_cors import CORS
from config import get_db_connection
from datetime import datetime
import hashlib
import random
import cv2 
import numpy as np
import os
from werkzeug.utils import secure_filename 
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
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
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

# FILE UPLOAD CONFIGURATION
UPLOAD_FOLDER = 'static/songs'
ALLOWED_EXTENSIONS = {'mp3'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

mail = Mail(app)

# Path for the trained model
MODEL_PATH = 'emotion_cnn_model.h5'
CASCADE_PATH = 'haarcascade_frontalface_default.xml'
emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']
last_predicted_mood = "None"

try:
    classifier = load_model(MODEL_PATH)
    face_classifier = cv2.CascadeClassifier(CASCADE_PATH)
    print("AI Model and Face Cascade loaded successfully!")
except Exception as e:
    print(f"Error loading AI components: {e}")

# CAMERA Integration 
class VideoCamera:
    def __init__(self):
        self.video = cv2.VideoCapture(0)

    def __del__(self):
        self.video.release()

    def get_frame(self):
        global last_predicted_mood
        success, frame = self.video.read()
        if not success:
            return None
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_classifier.detectMultiScale(gray, 1.3, 5)

        if len(faces) == 0:
            last_predicted_mood = "None"

        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 255), 2)
            roi_gray = gray[y:y+h, x:x+w]
            roi_gray = cv2.resize(roi_gray, (48, 48), interpolation=cv2.INTER_AREA)

            if np.sum([roi_gray]) != 0:
                roi = roi_gray.astype('float') / 255.0
                roi = img_to_array(roi)
                roi = np.expand_dims(roi, axis=0)

                prediction = classifier.predict(roi)[0]
                label = emotion_labels[prediction.argmax()]
                last_predicted_mood = label
                
                label_position = (x, y-10)
                cv2.putText(frame, f"Mood: {label}", label_position, cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            else:
                cv2.putText(frame, 'No Face Found', (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        ret, jpeg = cv2.imencode('.jpg', frame)
        return jpeg.tobytes()

def gen(camera):
    while True:
        frame = camera.get_frame()
        if frame is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')
        else:
            break

@app.route('/video_feed')
def video_feed():
    return Response(gen(VideoCamera()), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/get_mood', methods=['GET'])
def get_mood():
    global last_predicted_mood
    return jsonify({"mood": last_predicted_mood}), 200

# SAVE MOOD TO HISTORY 
@app.post("/save-mood")
def save_mood():
    data = request.json
    email = data.get("email")
    emotion = data.get("emotion")

    if not email or not emotion:
        return jsonify({"error": "Missing data"}), 400

    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute("INSERT INTO emotion_history (email, emotion) VALUES (%s, %s)", (email, emotion))
        db.commit()
        return jsonify({"message": "Mood saved successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# GET MOOD HISTORY WITH FILTERS
@app.post("/user/emotion-history")
def get_emotion_history():
    data = request.json
    email = data.get("email")
    mood_filter = data.get("mood_filter")
    start_date = data.get("start_date")   
    end_date = data.get("end_date")       

    query = "SELECT emotion, DATE_FORMAT(detected_at, '%Y-%m-%d %H:%i') as date FROM emotion_history WHERE email=%s"
    params = [email]

    if mood_filter and mood_filter != "All":
        query += " AND emotion = %s"
        params.append(mood_filter)
    
    if start_date and start_date.strip() != "":
        query += " AND DATE(detected_at) >= %s"
        params.append(start_date)
        
    if end_date and end_date.strip() != "":
        query += " AND DATE(detected_at) <= %s"
        params.append(end_date)

    query += " ORDER BY detected_at DESC"

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(query, tuple(params))
        history = cursor.fetchall()
        return jsonify(history), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Add songs logic (Admin)
@app.post("/admin/add-song")
def add_song():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        title = request.form.get('title')
        artist = request.form.get('artist')
        mood = request.form.get('mood')
        language = request.form.get('language')

        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{int(datetime.now().timestamp())}_{filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
            
            db = get_db_connection()
            cursor = db.cursor()
            query = "INSERT INTO songs (title, artist, mood, language, file_path) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(query, (title, artist, mood, language, unique_filename))
            db.commit()
            db.close()
            return jsonify({"message": "Song uploaded successfully!"}), 201
        else:
            return jsonify({"error": "Invalid file type (only MP3 allowed)"}), 400
            
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

# Get all songs (Admin)
@app.get("/admin/songs")
def get_all_songs():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM songs ORDER BY id DESC")
        songs = cursor.fetchall()
        return jsonify(songs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Delete songs (Admin)
@app.post("/admin/delete-song")
def delete_song():
    data = request.json
    song_id = data.get('id')
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT file_path FROM songs WHERE id=%s", (song_id,))
        result = cursor.fetchone()
        if result:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], result['file_path'])
            if os.path.exists(file_path):
                os.remove(file_path)
            cursor.execute("DELETE FROM songs WHERE id=%s", (song_id,))
            db.commit()
            return jsonify({"message": "Song deleted successfully"}), 200
        else:
            return jsonify({"error": "Song not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Display songs by mood detected (User)
@app.post("/user/get-playlist")
def get_playlist_by_mood():
    data = request.json
    mood = data.get('mood')
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        query = "SELECT * FROM songs WHERE mood=%s ORDER BY RAND() LIMIT 10"
        cursor.execute(query, (mood,))
        songs = cursor.fetchall()
        return jsonify(songs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route('/songs/<path:filename>')
def serve_songs(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def generate_otp():
    return str(random.randint(100000, 999999))

# Registration Logic
@app.post("/register-step1")
def register_step1():
    data = request.json
    username = data["username"]
    email = data["email"].lower().strip()
    password = hash_password(data["password"])
    otp = generate_otp()

    db = get_db_connection()
    cursor = db.cursor()

    try:
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
        return jsonify({"error": str(e)}), 500 
    finally:
        db.close()

# OTP Verification Logic
@app.post("/verify-registration")
def verify_registration():
    data = request.json
    email = data["email"].lower().strip()
    user_otp = data["otp"].strip()
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE email=%s AND otp=%s", (email, user_otp))
    user = cursor.fetchone()
    if user:
        cursor.execute("UPDATE users SET is_verified=1, otp=NULL WHERE email=%s", (email,))
        db.commit()
        db.close()
        return jsonify({"message": "Account verified successfully!"}), 201
    else:
        db.close()
        return jsonify({"error": "Invalid OTP!"}), 400

# Login Logic
@app.post("/login")
def login():
    data = request.json
    email = data.get("email", "").lower().strip()
    password = hash_password(data.get("password", ""))
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT username, email, is_admin FROM users WHERE email=%s AND password=%s", (email, password))
    user = cursor.fetchone()
    db.close()
    if user:
        return jsonify({
            "message": "Login successful!",
            "username": user["username"],
            "email": user["email"],
            "is_admin": user["is_admin"] 
        }), 200
    else:
        return jsonify({"error": "Invalid email or password!"}), 401

# Add user (Admin)
@app.post("/admin/add-user")
def admin_add_user():
    data = request.json
    username = data["username"]
    email = data["email"].lower().strip()
    password = hash_password(data["password"])
    is_admin = int(data["is_admin"]) 

    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        if cursor.fetchone():
            return jsonify({"error": "Email already registered!"}), 400

        cursor.execute("INSERT INTO users (username, email, password, is_admin, is_verified) VALUES (%s, %s, %s, %s, 1)",
                       (username, email, password, is_admin))
        db.commit()
        return jsonify({"message": "User created successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# View Users (Admin)
@app.route("/admin/users", methods=["GET"])
def get_all_users():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        query = "SELECT id, username, email, is_admin, DATE_FORMAT(created_at, '%Y-%m-%d') as registered_date FROM users"
        cursor.execute(query)
        users = cursor.fetchall()
        return jsonify(users), 200
    except Exception as e:
        try:
            cursor.close()
            cursor = db.cursor(dictionary=True)
            cursor.execute("SELECT id, username, email, is_admin FROM users")
            users = cursor.fetchall()
            for user in users:
                user['registered_date'] = '2024-01-01' 
            return jsonify(users), 200
        except Exception as e2:
            return jsonify({"error": str(e2)}), 500
    finally:
        if db.is_connected():
            db.close()

# Delete user (Admin)
@app.post("/admin/delete-user")
def admin_delete_user():
    data = request.json
    user_id = data.get("id")
    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM users WHERE id=%s", (user_id,))
        db.commit()
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Edit user (Admin)
@app.post("/admin/edit-user")
def admin_edit_user():
    data = request.json
    user_id = data.get("id")
    username = data.get("username")
    email = data.get("email").lower().strip()
    
    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute("UPDATE users SET username=%s, email=%s WHERE id=%s", (username, email, user_id))
        db.commit()
        return jsonify({"message": "User updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Profile View 
@app.route("/user/profile", methods=["GET"])
def get_profile():
    email = request.args.get('email').lower().strip()
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT username, email FROM users WHERE email=%s", (email,))
    user = cursor.fetchone()
    db.close()
    if user:
        return jsonify(user), 200
    return jsonify({"error": "User not found"}), 404

# Update Profile 
@app.post("/user/update-profile")
def update_profile():
    data = request.json
    old_email = data["old_email"].lower().strip()
    new_username = data["username"]
    new_email = data["email"].lower().strip()
    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute("UPDATE users SET username=%s, email=%s WHERE email=%s", 
                       (new_username, new_email, old_email))
        db.commit()
        return jsonify({"message": "Profile updated successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Change Password 
@app.post("/user/change-password")
def change_password():
    data = request.json
    email = data["email"].lower().strip()
    current_password = hash_password(data["current_password"])
    new_password = hash_password(data["new_password"])

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email=%s AND password=%s", (email, current_password))
    user = cursor.fetchone()

    if user:
        cursor.execute("UPDATE users SET password=%s WHERE email=%s", (new_password, email))
        db.commit()
        db.close()
        return jsonify({"message": "Password updated successfully!"}), 200
    else:
        db.close()
        return jsonify({"error": "Current password is incorrect!"}), 400

# Forgot Password 
@app.post("/forgot-password")
def forgot_password():
    data = request.json
    email = data.get("email", "").strip().lower()

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()

        if user:
            otp = generate_otp()
            print(f"Generated OTP for {email}: {otp}") 
            cursor.execute("UPDATE users SET otp=%s WHERE email=%s", (otp, email))
            db.commit()

            msg = Message('Moodify Password Reset Code', sender='tuladharunison@gmail.com', recipients=[email])
            msg.body = f"Your password reset code is: {otp}"
            mail.send(msg)
            return jsonify({"message": "OTP sent to your email"}), 200
        else:
            print(f"User not found for email: {email}") 
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        print(f"Error in forgot-password: {e}") 
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Verify OTP for Forgot Password
@app.post("/verify-forgot-otp")
def verify_forgot_otp():
    data = request.json
    email = data.get("email", "").strip().lower()
    otp = data.get("otp", "").strip()
    
    print(f"Verifying OTP for {email}. Input OTP: {otp}") 

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM users WHERE email=%s AND otp=%s", (email, otp))
        user = cursor.fetchone()
        
        if user:
            print("OTP Verified Successfully") 
            return jsonify({"message": "OTP Verified"}), 200
        else:
            cursor.execute("SELECT otp FROM users WHERE email=%s", (email,))
            actual_user = cursor.fetchone()
            if actual_user:
                print(f"Failed. Actual OTP in DB is: {actual_user['otp']}")
            else:
                print("Failed. User not found.")
            
            return jsonify({"error": "Invalid OTP"}), 400
    except Exception as e:
        print(f"Error in verify-otp: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Reset Password Logic
@app.post("/reset-password")
def reset_password():
    data = request.json
    email = data.get("email", "").strip().lower()
    new_password = hash_password(data.get("new_password"))

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()

        if user:
            cursor.execute("UPDATE users SET password=%s, otp=NULL WHERE email=%s", (new_password, email))
            db.commit()
            return jsonify({"message": "Password reset successfully!"}), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Delete Account 
@app.post("/user/delete-account")
def delete_account():
    data = request.json
    email = data["email"].lower().strip()
    password = hash_password(data["password"])

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT is_admin FROM users WHERE email=%s AND password=%s", (email, password))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "Incorrect password. Deletion failed."}), 400

        if user['is_admin'] == 1:
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE is_admin = 1")
            admin_data = cursor.fetchone()
            if admin_data['count'] <= 1:
                return jsonify({"error": "Cannot delete the only admin."}), 403

        cursor.execute("DELETE FROM users WHERE email=%s", (email,))
        db.commit()
        return jsonify({"message": "Account deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
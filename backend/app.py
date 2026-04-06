from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS
from config import get_db_connection
from datetime import datetime
import hashlib
import random
import cv2
import numpy as np
import os
import requests  # To call Jamendo API
from werkzeug.utils import secure_filename
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from flask_mail import Mail, Message

app = Flask(__name__)
CORS(app)

# MAIL CONFIGURATION PART 
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

emotion_labels = ['Angry', 'Happy', 'Neutral', 'Sad', 'Surprise']
last_predicted_mood = "None"

# Flag to control whether emotion detection is actively running to stop the camera 
detection_active = False
camera_instance = None

# Jamendo API Client ID
JAMENDO_CLIENT_ID = "78515f42"

try:
    classifier = load_model(MODEL_PATH)
    face_classifier = cv2.CascadeClassifier(CASCADE_PATH)
    print("AI Model and Face Cascade loaded successfully!")
except Exception as e:
    print(f"Error loading AI components: {e}")

def get_camera():
    """Open the camera if not already open. Returns the singleton VideoCapture instance."""
    global camera_instance
    if camera_instance is None or not camera_instance.isOpened():
        camera_instance = cv2.VideoCapture(0)
        print("Camera opened.")
    return camera_instance

def release_camera():
    """Explicitly release the camera hardware so the camera light turns off immediately."""
    global camera_instance
    if camera_instance is not None and camera_instance.isOpened():
        camera_instance.release()
        print("Camera released — light should be off.")
    camera_instance = None

def get_frame_from_camera():
    """Capture one frame, run face detection and emotion prediction, return JPEG bytes."""
    global last_predicted_mood
    cam = get_camera()
    success, frame = cam.read()
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


@app.route('/get_frame')
def get_frame():
    if not detection_active:
        return Response(status=204)
    frame = get_frame_from_camera()
    if frame is None:
        return Response(status=204)
    return Response(frame, mimetype='image/jpeg')

@app.route('/get_mood', methods=['GET'])
def get_mood():
    global last_predicted_mood
    return jsonify({"mood": last_predicted_mood}), 200

# Sets the detection to true to open the camera and start the detection 
@app.route('/start_detection', methods=['POST'])
def start_detection():
    global detection_active, last_predicted_mood
    detection_active = True
    last_predicted_mood = "None"  
    get_camera()  
    print("Detection started.")
    return jsonify({"message": "Detection started"}), 200

@app.route('/stop_detection', methods=['POST'])
def stop_detection():
    global detection_active
    detection_active = False
    release_camera()  
    print("Detection stopped and camera released.")
    return jsonify({"message": "Detection stopped"}), 200

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

# GET MOOD HISTORY 
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

# GET EMOTION ANALYTICS 
@app.route("/admin/emotion-analytics", methods=["POST"])
def get_admin_emotion_analytics():
    data = request.json or {}
    start_date = data.get("start_date")
    end_date = data.get("end_date")

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        query = "SELECT emotion as name, COUNT(*) as value FROM emotion_history"
        conditions = []
        params =[]

        if start_date and start_date.strip() != "":
            conditions.append("DATE(detected_at) >= %s")
            params.append(start_date)

        if end_date and end_date.strip() != "":
            conditions.append("DATE(detected_at) <= %s")
            params.append(end_date)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        # Group by emotion and sort
        query += " GROUP BY emotion ORDER BY value DESC"
        
        cursor.execute(query, tuple(params))
        data = cursor.fetchall()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if db.is_connected():
            db.close()

# Combined Playlist
@app.post("/user/get-playlist")
def get_playlist_by_mood():
    data = request.json
    mood = data.get('mood')

    # Multiple tag options per mood
    mood_tag_options = {
        'Happy':   ['pop', 'dance', 'upbeat', 'funk', 'party', 'happy', 'feel+good'],
        'Sad':     ['upbeat', 'motivational', 'energetic', 'positive', 'inspiring', 'cheerful'],
        'Angry':   ['chillout', 'relaxing', 'calm', 'meditation', 'ambient', 'peaceful'],
        'Surprise':['pop', 'electronic', 'indie', 'alternative', 'catchy', 'fun'],
        'Neutral': ['acoustic', 'chill', 'lofi', 'jazz', 'study', 'soft'],
    }

    tag_list = mood_tag_options.get(mood, ['pop'])

    api_songs = []

    # Pick 3 different random tags from the mood's list
    selected_tags = random.sample(tag_list, min(3, len(tag_list)))

    all_tracks = {}  

    for tag in selected_tags:
        offset = random.randint(0, 60)
        url = (
            f"https://api.jamendo.com/v3.0/tracks/"
            f"?client_id={JAMENDO_CLIENT_ID}"
            f"&format=json"
            f"&limit=50"        
            f"&offset={offset}"
            f"&tags={tag}"
            f"&audioformat=mp32"
        )
        try:
            print(f"DEBUG: Jamendo tag={tag}, offset={offset}, mood={mood}")
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                results = response.json().get("results", [])
                for track in results:
                    all_tracks[track['id']] = track
            else:
                print(f"Jamendo returned status {response.status_code} for tag {tag}")
        except Exception as e:
            print(f"Jamendo API failed for tag {tag}: {e}")

    # Now randomly pick 15 tracks
    pool = list(all_tracks.values())
    random.shuffle(pool)
    chosen = pool[:15]

    for track in chosen:
        api_songs.append({
            "id": f"api_{track['id']}",
            "title": track["name"],
            "artist": track["artist_name"],
            "mood": mood,
            "language": "English",
            "file_path": track["audio"],
            "image": track["album_image"],
            "is_api": True
        })

    # Fetching local songs from DB
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    local_songs = []
    try:
        query = "SELECT * FROM songs WHERE mood=%s ORDER BY RAND() LIMIT 20"
        cursor.execute(query, (mood,))

        db_results = cursor.fetchall()
        for s in db_results:
            local_songs.append({
                "id": s["id"],
                "title": s["title"],
                "artist": s["artist"],
                "mood": s["mood"],
                "language": s["language"],
                "file_path": s["file_path"],
                "image": None,
                "is_api": False
            })
    except Exception as e:
        print(f"Local DB fetch failed: {e}")
    finally:
        if db.is_connected():
            db.close()

    # Combine local songs
    combined = local_songs + api_songs

    return jsonify(combined), 200

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

    # Validate email format before attempting to send OTP
    import re
    if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
        return jsonify({"error": "Please enter a valid email address (e.g. name@gmail.com)"}), 400
    

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
        msg = Message('Moodify Verification Code', sender=('Moodify', 'tuladharunison@gmail.com'), recipients=[email])
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
        return jsonify({"message": "User added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Get all users (Admin)
@app.get("/admin/users")
def get_all_users():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, username, email, is_admin, is_verified, DATE_FORMAT(created_at, '%Y-%m-%d') as registered_date FROM users ORDER BY id DESC")
        users = cursor.fetchall()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
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

# Get User Profile
@app.get("/user/profile")
def get_profile():
    email = request.args.get("email", "").lower().strip()
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT username, email, address, gender FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()
        if user:
            return jsonify(user), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Update Profile
@app.post("/user/update-profile")
def update_profile():
    data = request.json
    email = data.get("email", "").lower().strip()
    new_username = data.get("username", "").strip()
    address = data.get("address", "").strip()
    gender = data.get("gender", "").strip()

    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute(
            "UPDATE users SET username=%s, address=%s, gender=%s WHERE email=%s",
            (new_username, address, gender, email)
        )
        db.commit()
        return jsonify({"message": "Profile updated successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Change Password Logic
@app.post("/user/change-password")
def change_password():
    data = request.json
    email = data.get("email", "").lower().strip()
    current_password = hash_password(data.get("current_password", ""))
    new_password = hash_password(data.get("new_password", ""))

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

            msg = Message('Moodify Password Reset Code', sender=('Moodify', 'tuladharunison@gmail.com'), recipients=[email])
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

# Like or Unlike a song 
@app.post("/user/like-song")
def like_song():
    data = request.json
    email = data.get("email")
    song_id = data.get("song_id")         
    song_title = data.get("song_title")
    song_artist = data.get("song_artist")
    song_mood = data.get("song_mood")
    song_image = data.get("song_image")    
    song_source = data.get("song_source")  
    file_path = data.get("file_path")      

    if not email or not song_id:
        return jsonify({"error": "Missing required fields"}), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id FROM liked_songs WHERE email=%s AND song_id=%s",
            (email, str(song_id))
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                "DELETE FROM liked_songs WHERE email=%s AND song_id=%s",
                (email, str(song_id))
            )
            db.commit()
            return jsonify({"message": "Song unliked", "liked": False}), 200
        else:
            cursor.execute(
                """INSERT INTO liked_songs
                   (email, song_id, song_title, song_artist, song_mood, song_image, song_source, file_path)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (email, str(song_id), song_title, song_artist, song_mood, song_image, song_source, file_path)
            )
            db.commit()
            return jsonify({"message": "Song liked", "liked": True}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Get all liked songs for a user
@app.post("/user/liked-songs")
def get_liked_songs():
    data = request.json
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """SELECT song_id, song_title, song_artist, song_mood,
                      song_image, song_source, file_path,
                      DATE_FORMAT(liked_at, '%Y-%m-%d %H:%i') as liked_at
               FROM liked_songs
               WHERE email=%s
               ORDER BY liked_at DESC""",
            (email,)
        )
        songs = cursor.fetchall()
        return jsonify(songs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Get liked song IDs only 
@app.post("/user/liked-song-ids")
def get_liked_song_ids():
    data = request.json
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT song_id FROM liked_songs WHERE email=%s",
            (email,)
        )
        ids = cursor.fetchall()
        return jsonify([row["song_id"] for row in ids]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Create a new playlist 
@app.post("/user/create-playlist")
def create_playlist():
    data = request.json
    email = data.get("email")
    name = data.get("name")
    image = data.get("image", None)  

    if not email or not name:
        return jsonify({"error": "Missing required fields"}), 400

    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute(
            "INSERT INTO playlists (email, name, image) VALUES (%s, %s, %s)",
            (email, name, image)
        )
        db.commit()
        return jsonify({"message": "Playlist created", "id": cursor.lastrowid}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Get all playlists for a user
@app.post("/user/get-playlists")
def get_user_playlists():
    data = request.json
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM playlists WHERE email=%s ORDER BY created_at DESC",
            (email,)
        )
        playlists = cursor.fetchall()
        return jsonify(playlists), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Update playlist name and/or cover image
@app.post("/user/update-playlist")
def update_playlist():
    data = request.json
    playlist_id = data.get("playlist_id")
    name = data.get("name")
    image = data.get("image", None)  

    if not playlist_id or not name:
        return jsonify({"error": "Missing required fields"}), 400

    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute(
            "UPDATE playlists SET name=%s, image=%s WHERE id=%s",
            (name, image, playlist_id)
        )
        db.commit()
        return jsonify({"message": "Playlist updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Add a song to a playlist
@app.post("/user/add-to-playlist")
def add_to_playlist():
    data = request.json
    playlist_id = data.get("playlist_id")
    song_id = data.get("song_id")
    song_title = data.get("song_title")
    song_artist = data.get("song_artist")
    song_mood = data.get("song_mood")
    song_image = data.get("song_image")
    song_source = data.get("song_source")
    file_path = data.get("file_path")

    if not playlist_id or not song_id:
        return jsonify({"error": "Missing required fields"}), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Check if song already in playlist
        cursor.execute(
            "SELECT id FROM playlist_songs WHERE playlist_id=%s AND song_id=%s",
            (playlist_id, str(song_id))
        )
        existing = cursor.fetchone()
        if existing:
            return jsonify({"message": "Song already in playlist"}), 200

        cursor.execute(
            """INSERT INTO playlist_songs
               (playlist_id, song_id, song_title, song_artist, song_mood, song_image, song_source, file_path)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (playlist_id, str(song_id), song_title, song_artist, song_mood, song_image, song_source, file_path)
        )
        db.commit()
        return jsonify({"message": "Song added to playlist"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Get all songs in a playlist
@app.post("/user/playlist-songs")
def get_playlist_songs():
    data = request.json
    playlist_id = data.get("playlist_id")

    if not playlist_id:
        return jsonify({"error": "Playlist ID is required"}), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM playlist_songs WHERE playlist_id=%s ORDER BY added_at DESC",
            (playlist_id,)
        )
        songs = cursor.fetchall()
        return jsonify(songs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Delete a playlist 
@app.post("/user/delete-playlist")
def delete_playlist():
    data = request.json
    playlist_id = data.get("playlist_id")

    if not playlist_id:
        return jsonify({"error": "Playlist ID is required"}), 400

    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM playlists WHERE id=%s", (playlist_id,))
        db.commit()
        return jsonify({"message": "Playlist deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Remove a song from a playlist
@app.post("/user/remove-from-playlist")
def remove_from_playlist():
    data = request.json
    playlist_song_id = data.get("playlist_song_id")

    if not playlist_song_id:
        return jsonify({"error": "playlist_song_id is required"}), 400

    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM playlist_songs WHERE id=%s", (playlist_song_id,))
        db.commit()
        return jsonify({"message": "Song removed from playlist"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Submit Feedback (User)
@app.post("/user/submit-feedback")
def submit_feedback():
    data = request.json
    email = data.get("email", "").strip()        
    name = data.get("name", "").strip()          # optional
    subject = data.get("subject", "").strip()    # mandatory
    message = data.get("message", "").strip()    # mandatory
    if not subject:
        return jsonify({"error": "Subject is required"}), 400
    if not message:
        return jsonify({"error": "Feedback message is required"}), 400
    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute(
            "INSERT INTO feedbacks (email, name, subject, message) VALUES (%s, %s, %s, %s)",
            (email, name, subject, message)
        )
        db.commit()
        return jsonify({"message": "Feedback submitted successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Get All Feedbacks (Admin)
@app.get("/admin/feedbacks")
def get_all_feedbacks():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """SELECT id, email, name, subject, message,
               DATE_FORMAT(submitted_at, '%Y-%m-%d %H:%i') as submitted_at
               FROM feedbacks ORDER BY submitted_at DESC"""
        )
        feedbacks = cursor.fetchall()
        return jsonify(feedbacks), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Delete a Feedback (Admin)
@app.post("/admin/delete-feedback")
def delete_feedback():
    data = request.json
    feedback_id = data.get("id")
    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM feedbacks WHERE id=%s", (feedback_id,))
        db.commit()
        return jsonify({"message": "Feedback deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)

from flask import Flask, request, jsonify, Response 
from flask_cors import CORS
from config import get_db_connection
import hashlib
import random
import cv2 
import numpy as np
import os
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

mail = Mail(app)

# Path for the trained model and Haar Cascade
MODEL_PATH = 'emotion_cnn_model.h5'
CASCADE_PATH = 'haarcascade_frontalface_default.xml'

# Dataset folders
emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']

# Global variable to track the latest mood for the frontend timer
last_predicted_mood = "None"

try:
    classifier = load_model(MODEL_PATH)
    face_classifier = cv2.CascadeClassifier(CASCADE_PATH)
    print("AI Model and Face Cascade loaded successfully!")
except Exception as e:
    print(f"Error loading AI components: {e}")

# CAMERA Integration with Emotion Detection
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
        
        # Convert frame to Grayscale 
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        # Detect faces in the frame
        faces = face_classifier.detectMultiScale(gray, 1.3, 5)

        # If no face is detected, reset the mood tracking
        if len(faces) == 0:
            last_predicted_mood = "None"

        for (x, y, w, h) in faces:
            # Draw rectangle around the face
            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 255), 2)
            
            # Crop and resize the face to 48x48 for the CNN model
            roi_gray = gray[y:y+h, x:x+w]
            roi_gray = cv2.resize(roi_gray, (48, 48), interpolation=cv2.INTER_AREA)

            if np.sum([roi_gray]) != 0:
                # Pre-process for the model
                roi = roi_gray.astype('float') / 255.0
                roi = img_to_array(roi)
                roi = np.expand_dims(roi, axis=0)

                # Predict Emotion
                prediction = classifier.predict(roi)[0]
                label = emotion_labels[prediction.argmax()]
                
                # Update global variable for the 5-second stability check
                last_predicted_mood = label
                
                # Overlay the label on the camera feed
                label_position = (x, y-10)
                cv2.putText(frame, f"Mood: {label}", label_position, cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            else:
                cv2.putText(frame, 'No Face Found', (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        # Encode back to JPEG for the web feed
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
    return Response(gen(VideoCamera()),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

# NEW ROUTE: Get Current Mood for 5-second logic
@app.route('/get_mood', methods=['GET'])
def get_mood():
    global last_predicted_mood
    return jsonify({"mood": last_predicted_mood}), 200

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def generate_otp():
    return str(random.randint(100000, 999999))

# Registration Logic
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
        db.close()
        return jsonify({"message": "Account verified successfully!"}), 201
    else:
        db.close()
        return jsonify({"error": "Invalid OTP!"}), 400

@app.post("/login")
def login():
    data = request.json
    email = data["email"]
    password = hash_password(data["password"])
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

# ADMIN ADD 
@app.post("/admin/add-user")
def admin_add_user():
    data = request.json
    username = data["username"]
    email = data["email"]
    password = hash_password(data["password"])
    is_admin = int(data["is_admin"]) # 1 for admin, 0 for user

    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        if cursor.fetchone():
            return jsonify({"error": "Email already registered!"}), 400

        # Create user 
        cursor.execute("INSERT INTO users (username, email, password, is_admin, is_verified) VALUES (%s, %s, %s, %s, 1)",
                       (username, email, password, is_admin))
        db.commit()
        return jsonify({"message": "User created successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Admin view users 
@app.route("/admin/users", methods=["GET"])
def get_all_users():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT username, email, is_admin FROM users")
        users = cursor.fetchall()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route("/user/profile", methods=["GET"])
def get_profile():
    email = request.args.get('email')
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT username, email FROM users WHERE email=%s", (email,))
    user = cursor.fetchone()
    db.close()
    if user:
        return jsonify(user), 200
    return jsonify({"error": "User not found"}), 404

@app.post("/user/update-profile")
def update_profile():
    data = request.json
    old_email = data["old_email"]
    new_username = data["username"]
    new_email = data["email"]
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

@app.post("/user/change-password")
def change_password():
    data = request.json
    email = data["email"]
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

# DELETE ACCOUNT WITH ADMIN CHECK
@app.post("/user/delete-account")
def delete_account():
    data = request.json
    email = data["email"]
    password = hash_password(data["password"])

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    try:
        # Verify credentials and get current user info
        cursor.execute("SELECT is_admin FROM users WHERE email=%s AND password=%s", (email, password))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "Incorrect password. Deletion failed."}), 400

        # If user is an Admin, check if they are the LAST admin
        if user['is_admin'] == 1:
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE is_admin = 1")
            admin_data = cursor.fetchone()
            if admin_data['count'] <= 1:
                return jsonify({"error": "There is only 1 admin in the database. Create another admin account to delete this account."}), 403

        cursor.execute("DELETE FROM users WHERE email=%s", (email,))
        db.commit()
        return jsonify({"message": "Account deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

if __name__ == "__main__":
    app.run(debug=True)
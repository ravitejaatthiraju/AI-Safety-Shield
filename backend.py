import cv2
import time
import json
import os
import threading
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

# --- IMPORTS FROM YOUR MODULES ---
from audio_thread import AudioThread
from weapon_detector import get_weapon_score
from proximity_logic import get_proximity_score

# Optional Imports (Graceful Fallback)
try:
    from pose_module import get_pose_score
except ImportError:
    def get_pose_score(f): return 0

try:
    from email_alert_module import send_danger_alert
except ImportError:
    def send_danger_alert(score, reason, email):
        print(f"🚨 [CONSOLE ALERT] To: {email} | Score: {score} | Reason: {reason}")

# --- FLASK APP SETUP ---
app = Flask(__name__)

# --- MANUAL CHANGE 1: JWT SECRET KEY ---
# Replace 'ai_safety_shield_secure_key_2024' with a long, random string for production.
app.config['JWT_SECRET_KEY'] = 'ai_safety_shield_secure_key_2024' 

CORS(app) 
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# --- USER DATABASE (JSON Prototype) ---
USER_DB = "users.json"

def load_users():
    if os.path.exists(USER_DB):
        with open(USER_DB, "r") as f:
            try: return json.load(f)
            except: return {}
    return {}

def save_users(users):
    with open(USER_DB, "w") as f:
        json.dump(users, f, indent=4)

# --- GLOBAL TELEMETRY STATE ---
telemetry = {
    "weapon_score": 0,
    "audio_score": 0,
    "pose_score": 0,
    "proximity_score": 0,
    "total_score": 0,
    "status": "SAFE",
    "weapon_label": "None",
    "threat_message": ""
}

camera = None

def get_camera():
    global camera
    if camera is None or not camera.isOpened():
        camera = cv2.VideoCapture(0, cv2.CAP_DSHOW) 
    return camera

def get_receiver_email():
    # --- MANUAL CHANGE 2: DEFAULT RECEIVER EMAIL ---
    # Change this to your preferred default notification email.
    default_email = "atthirajuraviteja26@gmail.com"
    try:
        if os.path.exists('email_config.json'):
            with open('email_config.json', 'r') as f:
                return json.load(f).get('email', default_email)
    except:
        pass
    return default_email

# --- AI PROCESSING GENERATOR ---
def generate_frames():
    global telemetry
    
    audio_checker = AudioThread(1)
    audio_checker.daemon = True
    audio_checker.start()

    SKIP_RATE = 5
    ALERT_THRESHOLD = 60
    frame_count = 0
    alert_cooldown = 0
    
    current_w_score = 0
    current_prox_score = 0
    current_pose_score = 0
    detected_weapon_label = "None"

    cap = get_camera()

    while True:
        success, frame = cap.read()
        if not success:
            break
            
        frame_count += 1
        frame = cv2.resize(frame, (480, 360))
        
        if frame_count % SKIP_RATE == 0:
            res = get_weapon_score(frame)
            if isinstance(res, tuple):
                current_w_score = 45 if res[0] > 0 else 0
                raw_list = res[1]
                detected_weapons = [item for item in raw_list if item in ["baseball bat", "scissors", "knife"]]
                detected_weapon_label = detected_weapons[0] if detected_weapons else "None"
                if not detected_weapons: current_w_score = 0
                raw_results = res[2]
            else:
                current_w_score = 0
                detected_weapon_label = "None"
                raw_results = None

            current_prox_score = get_proximity_score(raw_results)
            current_pose_score = get_pose_score(frame)

        current_audio_score = audio_checker.get_score()
        total_score = int(current_pose_score + current_audio_score + current_w_score + current_prox_score)
        
        status = "SAFE"
        if total_score >= ALERT_THRESHOLD: status = "DANGER"
        elif total_score >= 35: status = "WARNING"

        telemetry.update({
            "weapon_score": current_w_score,
            "audio_score": current_audio_score,
            "pose_score": int(current_pose_score),
            "proximity_score": current_prox_score,
            "total_score": total_score,
            "status": status,
            "weapon_label": detected_weapon_label
        })

        if total_score >= ALERT_THRESHOLD and alert_cooldown == 0:
            reasons = []
            if current_w_score > 0: reasons.append("Weapon")
            if current_audio_score > 0: reasons.append("Scream")
            if current_pose_score > 0: reasons.append("Pose")
            if current_prox_score > 0: reasons.append("Crowd")
            
            msg = ", ".join(reasons) if reasons else "Unknown Threat"
            telemetry["threat_message"] = msg
            
            target_email = get_receiver_email()
            send_danger_alert(total_score, msg, target_email)
            alert_cooldown = 300 
        
        if alert_cooldown > 0: alert_cooldown -= 1

        ret, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

# --- AUTH ROUTES ---

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    users = load_users()
    if username in users:
        return jsonify({"msg": "User already exists"}), 400
    
    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    users[username] = hashed_pw
    save_users(users)
    return jsonify({"msg": "User created successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    users = load_users()
    user_pw = users.get(username)
    
    if user_pw and bcrypt.check_password_hash(user_pw, password):
        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token), 200
    
    return jsonify({"msg": "Invalid username or password"}), 401

# --- PROTECTED ROUTES ---

@app.route('/video_feed')
def video_feed():
    token = request.args.get('token')
    if not token:
        return "Unauthorized", 401
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
@jwt_required()
def get_status():
    return jsonify(telemetry)

@app.route('/update-email', methods=['POST'])
@jwt_required()
def update_email():
    data = request.json
    email = data.get('email')
    if email:
        with open('email_config.json', 'w') as f:
            json.dump({'email': email}, f)
        return jsonify({"message": "Email updated", "email": email}), 200
    return jsonify({"error": "Invalid email"}), 400

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
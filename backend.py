import cv2
import time
import json
import os
import threading
from flask import Flask, Response, jsonify, request
from flask_cors import CORS

# --- IMPORTS FROM YOUR MODULES ---
# Ensure these files are in the same directory
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
CORS(app)  # Enable CORS for React Frontend

# --- GLOBAL STATE ---
# This dictionary holds the latest AI results to send to the dashboard
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

# Video Camera Setup
camera = None

def get_camera():
    global camera
    if camera is None or not camera.isOpened():
        # CAP_DSHOW is faster on Windows, remove if on Linux/Mac
        camera = cv2.VideoCapture(0, cv2.CAP_DSHOW) 
    return camera

def get_receiver_email():
    """Reads email from config, identical to your original logic."""
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
    
    # Initialize Audio Thread
    audio_checker = AudioThread(1)
    audio_checker.daemon = True
    audio_checker.start()

    # Settings
    SKIP_RATE = 5
    ALERT_THRESHOLD = 60
    frame_count = 0
    alert_cooldown = 0
    
    # Local memory for smoothing
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
        
        # --- AI DETECTION LOGIC (Every 5th frame) ---
        if frame_count % SKIP_RATE == 0:
            
            # 1. Weapon
            res = get_weapon_score(frame)
            if isinstance(res, tuple):
                current_w_score = 45 if res[0] > 0 else 0
                raw_list = res[1]
                # Filter specific weapons
                detected_weapons = [item for item in raw_list if item in ["baseball bat", "scissors", "knife"]]
                detected_weapon_label = detected_weapons[0] if detected_weapons else "None"
                if not detected_weapons: current_w_score = 0
                
                raw_results = res[2]
            else:
                current_w_score = 0
                detected_weapon_label = "None"
                raw_results = None

            # 2. Proximity
            current_prox_score = get_proximity_score(raw_results)

            # 3. Pose
            current_pose_score = get_pose_score(frame)

        # 4. Audio (Real-time)
        current_audio_score = audio_checker.get_score()

        # Calculate Total
        total_score = int(current_pose_score + current_audio_score + current_w_score + current_prox_score)
        
        # Determine Status
        status = "SAFE"
        if total_score >= ALERT_THRESHOLD: status = "DANGER"
        elif total_score >= 35: status = "WARNING"

        # Update Global Telemetry for API
        telemetry["weapon_score"] = current_w_score
        telemetry["audio_score"] = current_audio_score
        telemetry["pose_score"] = int(current_pose_score)
        telemetry["proximity_score"] = current_prox_score
        telemetry["total_score"] = total_score
        telemetry["status"] = status
        telemetry["weapon_label"] = detected_weapon_label

        # --- ALERT LOGIC ---
        if total_score >= ALERT_THRESHOLD and alert_cooldown == 0:
            reasons = []
            if current_w_score > 0: reasons.append("Weapon")
            if current_audio_score > 0: reasons.append("Scream")
            if current_pose_score > 0: reasons.append("Pose")
            if current_prox_score > 0: reasons.append("Crowd")
            
            msg = ", ".join(reasons) if reasons else "Unknown Threat"
            telemetry["threat_message"] = msg
            
            # Trigger Alert
            target_email = get_receiver_email()
            print(f"🚀 Sending Alert to {target_email}")
            send_danger_alert(total_score, msg, target_email)
            
            alert_cooldown = 300 # Reset cooldown
        
        if alert_cooldown > 0: 
            alert_cooldown -= 1

        # Encode Frame for Streaming
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

# --- ROUTES ---

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def get_status():
    """API for Frontend to poll current AI metrics"""
    return jsonify(telemetry)

@app.route('/update-email', methods=['POST'])
def update_email():
    """API to update emergency contact"""
    data = request.json
    email = data.get('email')
    if email:
        with open('email_config.json', 'w') as f:
            json.dump({'email': email}, f)
        return jsonify({"message": "Email updated", "email": email}), 200
    return jsonify({"error": "Invalid email"}), 400

if __name__ == "__main__":
    # Run on port 5000
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
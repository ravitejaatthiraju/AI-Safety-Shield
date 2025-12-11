import cv2
import time
import sys
import os

# --- IMPORTS ---
from audio_thread import AudioThread 
from weapon_detector import get_weapon_score
from proximity_logic import get_proximity_score

# ✅ Import Pose Module
try:
    from pose_module import get_pose_score
except ImportError:
    print("⚠️ WARNING: pose_module.py not found. Pose detection disabled.")
    def get_pose_score(f): return 0

# ✅ NEW: Import your Email Alert Module
# This imports the function that sends the location-based email
try:
    from email_alert_module import send_danger_alert
    print("✅ Email Alert System Loaded.")
except ImportError:
    print("⚠️ WARNING: email_alert_module.py not found. Alerts will be printed to console only.")
    # Fallback function if the file is missing
    def send_danger_alert(score, reason):
        print(f"🚨 [CONSOLE ALERT] Score: {score} | Reason: {reason}")

def main():
    # 1. FAST CAMERA SETUP
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return
    
    # 2. SETTINGS
    TARGET_WIDTH = 480 
    TARGET_HEIGHT = 360
    SKIP_RATE = 5        
    ALERT_THRESHOLD = 60 
    
    # 3. MEMORY VARIABLES
    frame_count = 0
    current_weapon_score = 0
    current_proximity_score = 0
    current_pose_score = 0
    current_weapons_detected = []
    
    # Alert Cooldown (Prevents spamming Emails/Sound)
    # 150 frames approx 5-8 seconds depending on FPS
    alert_cooldown = 0 
    
    # 4. START AUDIO ENGINE
    audio_checker = AudioThread(1)
    audio_checker.daemon = True 
    audio_checker.start()
    
    print(f"System Armed. Consensus Threshold: {ALERT_THRESHOLD}")

    try:
        while True:
            ret, frame = cap.read()
            if not ret: break

            frame_count += 1
            frame = cv2.resize(frame, (TARGET_WIDTH, TARGET_HEIGHT))

            # ---------------------------------------------------------
            # AI PROCESSING (Runs every 5th Frame)
            # ---------------------------------------------------------
            if frame_count % SKIP_RATE == 0:
                
                # --- A. WEAPON DETECTION (45 Points) ---
                result_data = get_weapon_score(frame)
                
                if isinstance(result_data, tuple):
                    w_score = result_data[0]
                    raw_list = result_data[1]
                    raw_results = result_data[2]
                    
                    if w_score > 0:
                        current_weapon_score = 45 
                        
                    current_weapons_detected = []
                    for item in raw_list:
                        if item in ["baseball bat", "scissors", "knife"]:
                            current_weapons_detected.append("WEAPON")
                        else:
                            current_weapons_detected.append(item)
                    
                    if not current_weapons_detected:
                        current_weapon_score = 0
                else:
                    current_weapon_score = 0
                    current_weapons_detected = []
                    raw_results = None
                
                # --- B. PROXIMITY CHECK (15 Points) ---
                current_proximity_score = get_proximity_score(raw_results)
                
                # --- C. POSE CHECK (20 or 30 Points) ---
                current_pose_score = get_pose_score(frame)

            # ---------------------------------------------------------
            # SCORING & ALERT LOGIC
            # ---------------------------------------------------------
            last_audio_pts = audio_checker.get_score() 
            
            total_score = (
                int(current_pose_score) + 
                int(last_audio_pts) + 
                int(current_weapon_score) + 
                int(current_proximity_score)
            )

            # --- 🚨 NEW ALERT TRIGGER LOGIC 🚨 ---
            if total_score >= ALERT_THRESHOLD:
                # Only trigger if we are not in a cooldown period
                if alert_cooldown == 0:
                    
                    # 1. Determine the specific threat for the alert message
                    reason_list = []
                    if current_weapon_score > 0: reason_list.append("Weapon Detected")
                    if last_audio_pts > 0: reason_list.append("Distress Scream")
                    if current_pose_score > 0: reason_list.append("Emergency Pose")
                    if current_proximity_score > 0: reason_list.append("Aggressive Crowd")
                    
                    # Join them (e.g., "Weapon Detected, Distress Scream")
                    threat_message = ", ".join(reason_list) if reason_list else "Unknown Danger"
                    
                    # 2. Call your external Email Alert Module
                    # This sends the Email with Location Map
                    print(f"🚀 Triggering Email Alert: {threat_message}")
                    send_danger_alert(total_score, threat_message)
                    
                    # 3. Activate Cooldown (wait ~10-15 seconds before next email to avoid spam)
                    # Increased slightly for email (300 frames)
                    alert_cooldown = 300 
            
            # Decrease cooldown timer if it's active
            if alert_cooldown > 0:
                alert_cooldown -= 1

            # ---------------------------------------------------------
            # VISUALIZATION (DASHBOARD)
            # ---------------------------------------------------------
            color = (0, 255, 0) # Green
            status = "SAFE"
            border_thickness = 0
            
            if total_score >= ALERT_THRESHOLD:
                color = (0, 0, 255) # Red
                status = "DANGER DETECTED"
                border_thickness = 10 # Thick red border on screen
            elif total_score >= 35:
                color = (0, 255, 255) # Yellow
                status = "WARNING"
                border_thickness = 4

            # Draw Visual Alert Border
            if border_thickness > 0:
                cv2.rectangle(frame, (0,0), (TARGET_WIDTH, TARGET_HEIGHT), color, border_thickness)

            # Top UI Background
            cv2.rectangle(frame, (0, 0), (TARGET_WIDTH, 60), (0, 0, 0), -1)
            
            # Status Text
            cv2.putText(frame, f"STATUS: {status}", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            cv2.putText(frame, f"SCORE: {total_score}/{ALERT_THRESHOLD}", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            
            # Weapon Label
            if current_weapons_detected:
                cv2.putText(frame, f"Weapon: {current_weapons_detected[0]}", (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 2)

            # Bottom Breakdown
            info_text = f"Aud:{last_audio_pts} Wpn:{current_weapon_score} Pose:{current_pose_score} Prox:{current_proximity_score}"
            cv2.putText(frame, info_text, (5, TARGET_HEIGHT - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (50, 50, 50), 3) # Outline
            cv2.putText(frame, info_text, (5, TARGET_HEIGHT - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1) # Text

            cv2.imshow('Surveillance System', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    except KeyboardInterrupt:
        pass
    
    finally:
        audio_checker.stop()
        cap.release()
        cv2.destroyAllWindows()
        os._exit(0)

if __name__ == "__main__":
    main()
import streamlit as st
import cv2
import time
import datetime
import threading
import numpy as np
from collections import deque
import warnings

# Suppress protobuf warnings
warnings.filterwarnings("ignore", category=UserWarning, module='google.protobuf')

# ==========================================
# 1. ROBUST BACKEND INTEGRATION
# ==========================================
# We wrap imports in try-except blocks to ensure the UI 
# doesn't crash if a module is missing or has an error.

try:
    from audio_thread import AudioThread
    AUDIO_AVAILABLE = True
except ImportError:
    st.warning("⚠️ 'audio_thread.py' not found. Audio monitoring disabled.")
    AUDIO_AVAILABLE = False

try:
    from weapon_detector import get_weapon_score
except ImportError:
    # Dummy fallback: returns score 0, empty list, None for results
    get_weapon_score = lambda x: (0, [], None)

try:
    from proximity_logic import get_proximity_score
except ImportError:
    get_proximity_score = lambda x: 0

try:
    from pose_module import get_pose_score
except ImportError:
    get_pose_score = lambda x: 0

try:
    from email_alert_module import send_danger_alert
except ImportError:
    def send_danger_alert(score, reason):
        print(f"[Simulated Alert] {reason} (Score: {score})")

# ==========================================
# 2. PAGE CONFIGURATION & STYLING
# ==========================================
st.set_page_config(
    page_title="AI Safety Shield",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS for Mobile Responsiveness and "Traffic Light" Animations
st.markdown("""
<style>
    /* Main App Padding */
    .block-container {
        padding-top: 2rem;
        padding-bottom: 1rem;
    }

    /* Metric Card Styling */
    div[data-testid="stMetric"] {
        background-color: #1E1E1E;
        border: 1px solid #333;
        padding: 10px;
        border-radius: 8px;
        color: white;
        transition: transform 0.2s;
    }
    div[data-testid="stMetric"]:hover {
        transform: scale(1.02);
        border-color: #555;
    }
    
    /* Status Banners */
    .status-box {
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        font-family: 'Helvetica', sans-serif;
        font-weight: 800;
        font-size: 24px;
        margin-bottom: 20px;
        color: white;
        text-transform: uppercase;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
    
    .safe { 
        background: linear-gradient(135deg, #00b09b 0%, #96c93d 100%); 
        border: 2px solid #00E676; 
    }
    
    .warning { 
        background: linear-gradient(135deg, #fce38a 0%, #f38181 100%); 
        color: #333; 
        border: 2px solid #FFD740; 
    }
    
    /* Danger Pulse Animation */
    @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7); border-color: #FF5252;}
        70% { box-shadow: 0 0 0 15px rgba(255, 82, 82, 0); border-color: #FF1744;}
        100% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); border-color: #FF5252;}
    }
    
    .danger {
        background: linear-gradient(135deg, #cb2d3e 0%, #ef473a 100%);
        animation: pulse 1.5s infinite;
        color: white;
    }
</style>
""", unsafe_allow_html=True)

# ==========================================
# 3. SESSION STATE MANAGEMENT
# ==========================================

# Initialize Audio Thread (Run once in background)
if 'audio_thread' not in st.session_state:
    if AUDIO_AVAILABLE:
        st.session_state.audio_thread = AudioThread(1)
        st.session_state.audio_thread.daemon = True
        st.session_state.audio_thread.start()
    else:
        st.session_state.audio_thread = None

# Logic State
if 'alert_cooldown' not in st.session_state:
    st.session_state.alert_cooldown = 0

# ==========================================
# 4. DASHBOARD LAYOUT
# ==========================================

# -- Header --
col_header, col_toggle = st.columns([3, 1])
with col_header:
    st.title("🛡️ AI Safety Shield")
    st.markdown("**Real-time Multimodal Surveillance Dashboard**")

with col_toggle:
    st.write("") # Spacer
    system_armed = st.checkbox("🔥 ARM SYSTEM", value=True, help="Toggle AI Detection ON/OFF")

# -- Status Banner Placeholder --
status_placeholder = st.empty()

# -- Main Content Grid --
col_video, col_stats = st.columns([1.8, 1])

with col_video:
    video_placeholder = st.empty()

with col_stats:
    st.markdown("### 📡 Threat Telemetry")
    
    # 2x2 Grid for Metrics (Mobile Friendly)
    m_col1, m_col2 = st.columns(2)
    m_col3, m_col4 = st.columns(2)
    
    metric_weapon = m_col1.empty()
    metric_audio = m_col2.empty()
    metric_pose = m_col3.empty()
    metric_prox = m_col4.empty()

# ==========================================
# 5. CORE LOGIC & LOOP
# ==========================================

def run_surveillance():
    # Camera Setup
    # Note: On deployed servers, this requires streamlit-webrtc. 
    # For local usage, cv2.VideoCapture(0) works fine.
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    
    # Check if camera opened successfully
    if not cap.isOpened():
        st.error("🚨 Error: Camera not detected. Please check your webcam.")
        return

    # Configuration
    SKIP_RATE = 5        # Process AI every 5th frame to save CPU
    ALERT_THRESHOLD = 60 # Score to trigger Red Alert
    TARGET_W, TARGET_H = 640, 480
    
    # Loop Variables
    frame_count = 0
    current_w_score = 0
    current_w_label = "None"
    current_p_score = 0
    current_prox_score = 0
    
    # Main Loop
    while system_armed:
        ret, frame = cap.read()
        if not ret:
            st.warning("Video stream ended.")
            break
            
        frame_count += 1
        # Resize for consistent processing speed
        frame = cv2.resize(frame, (TARGET_W, TARGET_H))
        
        # --- A. AI INFERENCE (Throttled) ---
        if frame_count % SKIP_RATE == 0:
            # 1. Weapon Detection
            # Returns: (score, [labels], raw_yolo_results)
            w_res = get_weapon_score(frame)
            
            if isinstance(w_res, tuple):
                current_w_score = 45 if w_res[0] > 0 else 0
                detected_objs = w_res[1]
                raw_yolo_results = w_res[2]
                
                # Get the first detected weapon name or "None"
                current_w_label = detected_objs[0] if detected_objs else "None"
            else:
                current_w_score = 0
                current_w_label = "None"
                raw_yolo_results = None

            # 2. Pose Analysis
            current_p_score = get_pose_score(frame)
            
            # 3. Proximity Logic
            current_prox_score = get_proximity_score(raw_yolo_results)

        # --- B. AUDIO SCORING (Continuous) ---
        audio_score = 0
        if st.session_state.audio_thread:
            audio_score = st.session_state.audio_thread.get_score()

        # --- C. TOTAL SCORE CALCULATION ---
        total_score = current_w_score + current_p_score + current_prox_score + audio_score
        
        # --- D. ALERT LOGIC ---
        status_html = ""
        
        if total_score >= ALERT_THRESHOLD:
            # DANGER STATE
            status_html = f"""<div class="status-box danger">🚨 DANGER DETECTED (Score: {total_score})</div>"""
            
            # Check Cooldown
            if st.session_state.alert_cooldown == 0:
                # 1. Compile Threat Reasons
                reasons = []
                if current_w_score > 0: reasons.append(f"Weapon ({current_w_label})")
                if audio_score > 0: reasons.append("Distress Scream")
                if current_p_score > 0: reasons.append("Emergency Pose")
                if current_prox_score > 0: reasons.append("Aggressive Crowd")
                
                reason_str = ", ".join(reasons) if reasons else "Unknown Threat"
                
                # 2. Trigger External Alert (Email/SMS)
                # We use a thread inside the module, so this is non-blocking
                send_danger_alert(total_score, reason_str)
                
                # 3. Set Cooldown (e.g. 150 loops ~ 10-15 seconds)
                st.session_state.alert_cooldown = 150 
                
        elif total_score >= 35:
            # WARNING STATE
            status_html = f"""<div class="status-box warning">⚠️ WARNING - CAUTION (Score: {total_score})</div>"""
        else:
            # SAFE STATE
            status_html = f"""<div class="status-box safe">✅ SYSTEM SECURE (Score: {total_score})</div>"""

        # Update Status Banner
        status_placeholder.markdown(status_html, unsafe_allow_html=True)

        # --- E. UPDATE UI METRICS ---
        metric_weapon.metric("⚔️ Weapon", f"{current_w_score}", current_w_label, 
                             delta_color="inverse")
        metric_audio.metric("🎤 Audio", f"{audio_score}", "Scream!" if audio_score > 0 else "Listening", 
                            delta_color="inverse")
        metric_pose.metric("🙌 Pose", f"{current_p_score}", "Distress" if current_p_score > 0 else "Normal", 
                           delta_color="inverse")
        metric_prox.metric("📏 Proximity", f"{current_prox_score}", "Crowded" if current_prox_score > 0 else "Safe", 
                           delta_color="inverse")

        # --- F. VIDEO RENDER ---
        # Convert OpenCV BGR to Browser RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Add visual border to video if Danger
        if total_score >= ALERT_THRESHOLD:
            # Draw thick red border on frame
            cv2.rectangle(frame_rgb, (0,0), (TARGET_W, TARGET_H), (255, 0, 0), 20)
            
        video_placeholder.image(frame_rgb, channels="RGB", use_container_width=True)

        # --- G. HOUSEKEEPING ---
        if st.session_state.alert_cooldown > 0:
            st.session_state.alert_cooldown -= 1
            
        # Small sleep to prevent 100% CPU usage
        time.sleep(0.02)

    # Cleanup
    cap.release()

# ==========================================
# 6. ENTRY POINT
# ==========================================
if __name__ == "__main__":
    if system_armed:
        run_surveillance()
    else:
        # Idle State UI
        status_placeholder.info("System Disarmed. Toggle the switch above to start surveillance.")
        video_placeholder.image("https://via.placeholder.com/640x480?text=System+Offline", use_container_width=True)
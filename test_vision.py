import cv2
# Import the CLASS, not the missing function
from vision_module import WeaponDetector 

# --- CONFIGURATION ---
DANGER_COLOR = (0, 0, 255)  # Red
SAFE_COLOR = (0, 255, 0)    # Green

# Open Webcam
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ Error: Could not open webcam.")
    exit()

# INITIALIZE THE DETECTOR
detector = WeaponDetector()

print("✅ Starting Vision Test... Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret: break
    
    # --- 1. CALL THE WEAPON DETECTOR ---
    # We use the class method detect_frame()
    processed_frame, is_danger, label = detector.detect_frame(frame)
    
    # --- 2. ENHANCE THE VISUALS (UI LAYER) ---
    # Determine Color based on Weapon Detection
    if is_danger:
        status_color = DANGER_COLOR
        status_text = f"WARNING: {label.upper()} DETECTED"
    else:
        status_color = SAFE_COLOR
        status_text = "STATUS: SAFE"

    # Draw Dashboard Box
    cv2.rectangle(processed_frame, (0, 0), (640, 80), (50, 50, 50), -1) 
    
    # Display Status
    cv2.putText(processed_frame, status_text, (20, 50), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, status_color, 2)

    # --- 3. SHOW THE RESULT ---
    cv2.imshow("🛡️ AI Safety Shield - Weapon Test", processed_frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
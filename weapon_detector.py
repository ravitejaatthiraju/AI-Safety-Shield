import torch
from ultralytics import YOLO

# --- SMART DEVICE SELECTION ---
if torch.cuda.device_count() > 1:
    TARGET_DEVICE = 1 
    print(f"✅ Weapon Detector: Using Secondary GPU (cuda:1)")
elif torch.cuda.is_available():
    TARGET_DEVICE = 0 
    print(f"✅ Weapon Detector: Using Primary GPU (cuda:0)")
else:
    TARGET_DEVICE = 'cpu'
    print("⚠️ Weapon Detector: No GPU found. Using CPU (Will be slower).")

print("Loading YOLOv8 Model...")
try:
    model = YOLO('yolov8n.pt')
except Exception as e:
    print(f"Error loading model: {e}")

def get_weapon_score(frame):
    threat_score = 0
    detected_weapons = []
    
    try:
        # Run YOLO
        results = model(frame, device=TARGET_DEVICE, classes=[0, 34, 43, 76], verbose=False)
        
        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                name = model.names[cls]

                # --- DEBUG PRINT ---
                # This will show you in the terminal what the AI sees
                # print(f"DEBUG: Saw {name} with confidence {conf:.2f}")

                # --- NEW LOWER THRESHOLD (0.25) ---
                # Webcams are blurry, so we accept lower confidence
                if conf > 0.25:
                    if cls in [34, 43, 76]: # Knife, Bat, Scissors
                        threat_score = 45
                        detected_weapons.append(name)
                        print(f"!!! WEAPON FOUND: {name} ({conf:.2f}) !!!")
                        
    except Exception as e:
        print(f"Weapon Error: {e}")
        return 0, [], None

    return threat_score, detected_weapons, results
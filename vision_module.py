from ultralytics import YOLO
import cv2
import math

# --- CONFIGURATION ---
# CHANGED: Using 'yolov8s.pt' (Small) instead of Nano for better knife detection
MODEL_PATH = "yolov8s.pt" 

# CHANGED: Lowered to 0.25 so it catches the knife even if blurry
CONFIDENCE_THRESHOLD = 0.25 

class WeaponDetector:
    def __init__(self):
        # Initialize the YOLO model
        try:
            self.model = YOLO(MODEL_PATH)
            print(f"✅ Model '{MODEL_PATH}' loaded successfully.")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self.model = None

        # Class IDs for YOLOv8 standard model:
        # 43 = Knife, 76 = Scissors (sometimes knives look like scissors to AI)
        self.weapon_classes = [43, 76] 

    def detect_frame(self, frame):
        if not self.model:
            return frame, False, ""

        # Run inference
        results = self.model(frame, stream=True, verbose=False)
        weapon_detected = False
        detected_label = ""

        for r in results:
            boxes = r.boxes
            for box in boxes:
                conf = math.ceil((box.conf[0] * 100)) / 100
                cls = int(box.cls[0])

                # Check Confidence
                if conf > CONFIDENCE_THRESHOLD:
                    
                    # Check if it is a Knife (43) or Scissors (76)
                    if cls in self.weapon_classes:
                        
                        class_name = self.model.names[cls]
                        
                        # Draw Box
                        x1, y1, x2, y2 = box.xyxy[0]
                        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                        
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                        
                        cv2.putText(frame, f'{class_name} {conf}', 
                                    (max(0, x1), max(35, y1 - 10)), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                        
                        weapon_detected = True
                        detected_label = class_name

        # Return: The Frame, Boolean Alert, Label Name
        return frame, weapon_detected, detected_label
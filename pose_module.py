import cv2
import mediapipe as mp
import math

# --- INITIALIZATION ---
# We initialize MediaPipe outside the function so it loads only once.
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    smooth_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)
mp_drawing = mp.solutions.drawing_utils

def get_pose_score(frame):
    """
    Analyzes the frame for dangerous poses (Hands Up, Falling).
    Returns:
        score (int): Threat points (0, 20, or 30).
    """
    score = 0
    
    # 1. Convert to RGB (MediaPipe requires RGB input)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # 2. Process the frame
    results = pose.process(rgb_frame)
    
    # 3. If body detected, analyze landmarks
    if results.pose_landmarks:
        # OPTIONAL: Draw the skeleton on the frame (In-place modification)
        mp_drawing.draw_landmarks(
            frame, 
            results.pose_landmarks, 
            mp_pose.POSE_CONNECTIONS
        )
        
        landmarks = results.pose_landmarks.landmark
        
        # --- GET KEY COORDINATES ---
        # Note: y=0 is top of screen, y=1 is bottom
        nose_y = landmarks[mp_pose.PoseLandmark.NOSE].y
        left_wrist_y = landmarks[mp_pose.PoseLandmark.LEFT_WRIST].y
        right_wrist_y = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].y
        
        left_shoulder_y = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].y
        left_hip_y = landmarks[mp_pose.PoseLandmark.LEFT_HIP].y
        right_shoulder_y = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].y
        right_hip_y = landmarks[mp_pose.PoseLandmark.RIGHT_HIP].y

        # --- LOGIC 1: SURRENDER (Hands above Nose) ---
        if left_wrist_y < nose_y and right_wrist_y < nose_y:
            score = 30
            # Visual Feedback
            cv2.putText(frame, "STATUS: SURRENDER", (50, 200), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)

        # --- LOGIC 2: FALL DETECTION ---
        # Calculate vertical distance between shoulders and hips
        # If distance is small, torso is horizontal -> Lying down
        torso_height = abs(left_shoulder_y - left_hip_y)
        
        # Threshold: 0.1 is very small (horizontal). 
        # Standing person usually has > 0.3 or 0.4
        if torso_height < 0.25: 
            score = 20
            cv2.putText(frame, "STATUS: FALL DETECTED", (50, 250), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 165, 255), 3)

    return score
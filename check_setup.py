import cv2
import mediapipe as mp
import deepface
import os

# Fix for DeepFace on newer PCs
os.environ["TF_USE_LEGACY_KERAS"] = "1"

print("✅ OpenCV Version:", cv2.__version__)
print("✅ MediaPipe Version:", mp.__version__)
print("✅ DeepFace is installed!")
print("🎉 YOU ARE READY TO CODE.")
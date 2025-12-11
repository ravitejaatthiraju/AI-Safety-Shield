import speech_recognition as sr

# --- CONFIGURATION ---
# The specific words we are looking for
DISTRESS_KEYWORDS = ["help me", "save me", "police", "emergency", "please help", "danger"]

# Initialize the recognizer
recognizer = sr.Recognizer()

def listen_for_keywords():
    try:
        with sr.Microphone() as source:
            # 1. Reduced calibration time to make it snappier
            recognizer.adjust_for_ambient_noise(source, duration=0.1) 
            
            # 2. Reduced phrase limit to 2s to process short commands faster
            audio = recognizer.listen(source, timeout=2, phrase_time_limit=2)
            
            text = recognizer.recognize_google(audio).lower()
            
            if any(keyword in text for keyword in DISTRESS_KEYWORDS):
                return True, text
            else:
                return False, text

    except sr.WaitTimeoutError:
        return False, "" # Silence detected
    except sr.UnknownValueError:
        return False, "" # Speech was unintelligible
    except sr.RequestError:
        print("❌ API Error: Check Internet Connection")
        return False, "API Error"
    except Exception as e:
        print(f"❌ Audio Error: {e}")
        return False, "Error"
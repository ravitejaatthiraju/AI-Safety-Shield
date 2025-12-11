import threading
import time

# Robust Import
try:
    from audio_module import listen_for_keywords as check_audio
except ImportError:
    # Fallback if module is missing
    def check_audio(): return False, ""

class AudioThread(threading.Thread):
    def __init__(self, thread_id):
        threading.Thread.__init__(self)
        self.thread_id = thread_id
        self.running = True
        self.score = 0
        self.cooldown = 0
        self.last_text = ""

    def run(self):
        while self.running:
            try:
                # 1. Listen for keywords (This blocks until speech is heard)
                is_danger, text = check_audio()
                
                # 2. Logic: If Keyword Found -> IMMEDIATE ALERT (35 Points)
                if is_danger:
                    self.score = 35
                    self.cooldown = 1  # Keep alert active for ~5 seconds
                    self.last_text = text
                    # print(f"🚨 ALERT TRIGGERED: '{text}'")
                
                # 3. Cooldown Logic (Keep score high for a few seconds)
                elif self.cooldown > 0:
                    self.score = 35
                    self.cooldown -= 1
                else:
                    self.score = 0
                    self.last_text = ""
                    
            except Exception as e:
                print(f"Thread Error: {e}")
                self.score = 0
            
            # Small sleep not strictly necessary as listen() blocks, but good for safety
            time.sleep(0.1)

    def stop(self):
        self.running = False
        
    def get_score(self):
        return self.score
    
    def get_last_text(self):
        # Helper to show what word triggered it in your UI
        return self.last_text
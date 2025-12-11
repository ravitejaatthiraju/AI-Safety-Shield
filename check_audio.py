import time
import sys

print("--- SPEECH RECOGNITION DIAGNOSTIC ---")

# Import your module
try:
    from audio_module import listen_for_keywords
    print("✅ Success: Found 'listen_for_keywords'")
except ImportError:
    print("❌ CRITICAL ERROR: Could not find 'audio_module.py'.")
    sys.exit()

print("\n🎤 STARTING LISTENING TEST...")
print("   Say 'Help', 'Police', or 'Emergency' to test.")
print("   Press 'Ctrl+C' to stop.\n")

try:
    while True:
        print("👂 Listening...", end='\r')
        
        # Call the function
        is_danger, text = listen_for_keywords()
        
        # Print status
        if is_danger:
            print(f"\n🚨 DANGER DETECTED! Keyword found: '{text}'")
            print("   (Score would set to 35)\n")
        elif text:
            print(f"   🗣️  Heard: '{text}' (Safe)")
        else:
            # Silence or background noise
            pass
            
except KeyboardInterrupt:
    print("\n\n✅ Test Complete.")
import smtplib
import ssl
from email.message import EmailMessage
import geocoder # NEW: Import geocoder for location fetching

# --- CONFIGURATION ---
SENDER_EMAIL = "athirajuteja5@gmail.com" 
SENDER_PASSWORD = "ysfm rkgs cozo lmdg" 

# --- LOCATION FETCHING ---
def get_current_location():
    """
    Fetches approximate location using IP address.
    Returns: A Google Maps link or a status message.
    """
    try:
        g = geocoder.ip('me') 
        if g.latlng:
            latitude, longitude = g.latlng
            # Generates a Google Maps link for the coordinates
            return f"https://www.google.com/maps/search/?api=1&query={latitude},{longitude}"
        return "Location Unavailable (IP Geo-location failed)"
    except Exception as e:
        return f"Location Error: {e}"

# --- MAIN ALERT FUNCTION ---
def send_danger_alert(score, reason, receiver_email):
    """
    Sends an email alert when a threat is detected, including location.
    """
    # 1. Fetch Location
    loc_link = get_current_location()

    subject = f"🚨 SECURITY ALERT: Threat Detected (Score: {score})"
    
    body = f"""
⚠️ DANGER DETECTED ⚠️

The AI Surveillance System has flagged a high-priority threat.

------------------------------------------------
- Threat Score: {score}/100
- Reason: {reason}
- Location Map: {loc_link}
------------------------------------------------

Please check the live feed or contact the location immediately.
"""

    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = SENDER_EMAIL
    msg['To'] = receiver_email

    try:
        # Create a secure SSL context
        context = ssl.create_default_context()
        
        # Connect to Gmail's SMTP Server
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
            smtp.login(SENDER_EMAIL, SENDER_PASSWORD)
            smtp.send_message(msg)
            
        print(f"✅ Email Alert sent successfully to {receiver_email}!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email. Error: {e}")
        return False

# --- TEST FUNCTION ---
if __name__ == "__main__":
    test_receiver = "atthirajuraviteja26@gmail.com" 
    print("Testing email system...")
    send_danger_alert(99, "TEST RUN - IGNORE", test_receiver)
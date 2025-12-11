import smtplib
import ssl
from email.message import EmailMessage
import geocoder
import threading

# --- CONFIGURATION ---
# Replace with your details. 
# NOTE: For Gmail, use an 'App Password', not your login password.
SENDER_EMAIL = "athirajuteja5@gmail.com"
EMAIL_PASSWORD = "ysfm rkgs cozo lmdg" 
RECEIVER_EMAIL = "atthirajuraviteja26@gmail.com"

def get_current_location():
    """
    Fetches approximate location using IP address.
    Returns: A Google Maps link.
    """
    try:
        g = geocoder.ip('me') # Gets location from public IP
        if g.latlng:
            latitude, longitude = g.latlng
            return f"https://www.google.com/maps?q={latitude},{longitude}"
        return "Location Unavailable (Could not determine coordinates)"
    except Exception as e:
        return "Location Error"

def _send_async_email(score, reason):
    """
    Internal function to handle the sending process.
    """
    try:
        # 1. Get Location
        print("📍 Fetching location...", end="\r")
        loc_link = get_current_location()

        # 2. Build Email
        msg = EmailMessage()
        msg['Subject'] = f"🚨 DANGER ALERT: {reason} Detected!"
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECEIVER_EMAIL

        body_content = (
            f"⚠️ AUTOMATED SECURITY ALERT ⚠️\n\n"
            f"The AI Safety Shield has detected a potential threat.\n"
            f"------------------------------------------------\n"
            f"• Threat Reason: {reason}\n"
            f"• Threat Score:  {score}\n"
            f"• Location Map:  {loc_link}\n"
            f"------------------------------------------------\n"
            f"Please check the live feed or contact the location immediately."
        )
        msg.set_content(body_content)

        # 3. Send via Gmail SMTP
        context = ssl.create_default_context()
        # Note: 465 is the standard SSL port for Gmail
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
            smtp.login(SENDER_EMAIL, EMAIL_PASSWORD)
            smtp.send_message(msg)
        
        print(f"\n✅ Email Alert Sent to {RECEIVER_EMAIL}!")

    except Exception as e:
        print(f"\n❌ Failed to send email alert: {e}")

def send_danger_alert(score, reason):
    """
    Wrapper to run the email sender in a background thread.
    This prevents the camera video from freezing while sending.
    """
    email_thread = threading.Thread(target=_send_async_email, args=(score, reason))
    email_thread.daemon = True # Ensures thread dies if main program closes
    email_thread.start()
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_reset_email(to_email, reset_link):
    sender_email = os.getenv("EMAIL_USER")      # your email
    sender_password = os.getenv("EMAIL_PASS")  #  app password

    subject = "Password Reset Request"
    body = f"""
    Hello,

    You requested a password reset. Click the link below:

    {reset_link}

    This link will expire in 30 minutes.

    If you did not request this, ignore this email.
    """

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
    except Exception as e:
        print("[EMAIL ERROR]:", e)
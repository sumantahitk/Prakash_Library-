import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: `"Prakash Library" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email: ', error);
    return false;
  }
};

// WhatsApp mock function
export const sendWhatsApp = async (to, message) => {
  // In a real scenario, integrate Twilio or Meta API here
  console.log(`Sending WhatsApp to ${to}: ${message}`);
  return true;
};

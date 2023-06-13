import dotenv from "dotenv";

dotenv.config();

export const CLIENT_URL = process.env.CLIENT_URL;

export const GMAIL_USER = process.env.GMAIL_USER;

export const GMAIL_PASS = process.env.GMAIL_PASS;

export const fromAdminMail = process.env.fromAdminMail;
fromAdminMail as any

export const userSubject = process.env.userSubject as any;

export const accountSid = process.env.accountSid as string;

export const FROM_NAME = process.env.FROM_NAME as string;

export const FROM_EMAIL = process.env.FROM_EMAIL as string;

export const JWT_SECRET = process.env.JWT_SECRET as string;

export const JWT_EXPIRE = process.env.JWT_EXPIRE as any;

export const SENDGRID_KEY = process.env.SENDGRID_KEY as string;

export const authToken = process.env.authToken as string;

export const fromAminPhone = process.env.fromAminPhone as string;

export const GenerateOTP = () => {
    const otp = Math.floor(1000 + Math.random() * 9000);
  
    const expiry = new Date();
  
    expiry.setTime(new Date().getTime() + 30 * 60 * 1000);
    return { otp, expiry };
  };

export function generateRandomPassword(length:any) {
    let result = "";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
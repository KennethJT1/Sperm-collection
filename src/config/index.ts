import dotenv from "dotenv";

dotenv.config();

export const accountSid = process.env.ACCOUNTSID;
export const authToken = process.env.AUTHTOKEN;
export const fromAminPhone = process.env.fromAdminPhone;

export const SMTP_HOST = process.env.SMTP_HOST;

export const SMTP_PASSWORD = process.env.SMTP_PASSWORD as string;

export const SMTP_PORT = process.env.SMTP_PORT as string;

export const SMTP_EMAIL = process.env.SMTP_EMAIL as string;

export const FROM_NAME = process.env.FROM_NAME as string;

export const FROM_EMAIL = process.env.FROM_EMAIL as string;

export const fromAdminMail = process.env.fromAdminMail;
fromAdminMail as any;

export const userSubject = process.env.userSubject as any;

export const JWT_SECRET = process.env.JWT_SECRET as string;

export const SENDGRID_KEY = process.env.SENDGRID_KEY as string;
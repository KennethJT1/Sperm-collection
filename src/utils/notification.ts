import {
  accountSid,
  authToken,
  fromAminPhone,
  fromAdminMail,
  userSubject,
  GMAIL_USER,
  GMAIL_PASS,
} from "../config";
import nodemailer from "nodemailer";
import twilio from "twilio";

const client = twilio(accountSid, authToken);

//Site that helps to send otp
export const onRequestOTP = async (otp: number, toPhoneNumber: string) => {
  const response = await client.messages.create({
    body: `Your OTP is ${otp}`,
    from: fromAminPhone,
    to: toPhoneNumber,
  });
  return response;
};
//send new password
export const onPasswordReset = async (password: any, toPhoneNumber: string) => {
  const response = await client.messages.create({
    body: `Your new password is ${password}, please reset your password in your dashboard after you've logged in with this`,
    from: fromAminPhone,
    to: toPhoneNumber,
  });
  return response;
};

//This is for sending mails
export const transport = nodemailer.createTransport({
  //service and host are the same
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
  //tls is to know whether the mail has been received or not
  tls: {
    rejectUnauthorized: false,
  },
});


export const mailsent = async (
  from: string,
  to: string,
  subject: string,
  html: string
) => {
  try {
    const response = await transport.sendMail({
      from: fromAdminMail,
      to,
      subject: userSubject,
      html,
    });
  } catch (error) {
    console.log(error);
  }
};

export const emailHtml = (otp: number): string => {
  const temp = `
      <div style="max-width: 700px; font-size:110%; border: 10px solid #add; padding: 50px 20px; margin: auto">
      <h2 style="text-transform: uppercase; text-align: center; color: teal">
         Welcome to Kenneth Sperm Bank
      </h2>
      <p> Hi there, your otp is ${otp}, it will expire in 10mins</p>
      </div>
    `;
  return temp;
};

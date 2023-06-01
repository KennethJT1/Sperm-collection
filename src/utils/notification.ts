// import nodemailer from "nodemailer";
// require("dotenv").config();

// export const sendEmail = async (options:any): Promise<void> => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: parseInt(process.env.SMTP_PORT!, 10),
//     auth: {
//       user: process.env.SMTP_EMAIL,
//       pass: process.env.SMTP_PASSWORD,
//     },
//   });

//   const message = {
//     from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };

//   const info = await transporter.sendMail(message);

//   console.log("Message sent: %s", info.messageId);
// };

// export const emailHtml = (otp: number): string => {
//   const temp = `
//       <div style="max-width: 700px; font-size:110%; border: 10px solid #add; padding: 50px 20px; margin: auto">
//       <h2 style="text-transform: uppercase; text-align: center; color: teal">
//          Welcome to Wilson Sperm Bank
//       </h2>
//       <p> Hi there, your otp is ${otp}, it will expire in 30mins</p>
//       </div>
//     `;
//   return temp;
// };


import nodemailer from "nodemailer";
require("dotenv").config();

export const sendEmail = async (options:any): Promise<void> => {
  const transporter = nodemailer.createTransport({
    // host: process.env.SMTP_HOST,
    host: "smtp.gmail.com",
    // port: parseInt(process.env.SMTP_PORT!, 10),
    port: 465,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    secure: true
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
};

export const emailHtml = (otp: number): string => {
  const temp = `
      <div style="max-width: 700px; font-size:110%; border: 10px solid #add; padding: 50px 20px; margin: auto">
      <h2 style="text-transform: uppercase; text-align: center; color: teal">
         Welcome to Wilson Sperm Bank
      </h2>
      <p> Hi there, your otp is ${otp}, it will expire in 30mins</p>
      </div>
    `;
  return temp;
};
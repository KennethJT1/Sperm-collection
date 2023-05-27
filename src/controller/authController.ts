import { Request, Response } from "express";
import User from "../models/users";
import bcrypt from "bcrypt";
import {
  GenerateSalt,
  GenerateSignature,
  verifySignature,
} from "../utils/utils";
import { GenerateOTP, emailHtml, sendEmail } from "../utils/notification";
import sgMail from "@sendgrid/mail";
import { SENDGRID_KEY } from "../config";
import { JwtPayload } from "jsonwebtoken";

sgMail.setApiKey(SENDGRID_KEY);

export const Createuser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email, verified: true });
    // await User.findOne({
    //   where: { email: email },
    // });
    console.log("existingUser===> ", existingUser);
    // const existingUserverify = await User.findOne({
    //   where: { verified: true },
    // });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    } else {
      const salt = await GenerateSalt();
      const hashPassowrd = await bcrypt.hash(password, salt);

      const { otp, expiry } = GenerateOTP();

      const newUser = await User.create({
        email,
        password: hashPassowrd,
        firstName,
        lastName,
        otp,
        expiry,
        verified: false,
        role: "user",
      });
      console.log("newUser===> ", newUser);

      //send mail to user
      // const html = emailHtml(otp);
      // await sendEmail({
      //   email,
      //   subject: "OTP",
      //   message: html,
      // });

      //Check if the registered user exist
      const registeredUser = await User.findOne({
        where: { email: email },
      });

      //Generate signature for user
      const signature = await GenerateSignature({
        id: registeredUser!._id,
        email: registeredUser!.email,
      });

      const emailData = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: "OTP",
        html: `
          <h1>Hi ${firstName} ${lastName}, Your OTP status is: <span style="color:cyan;">${otp}</span></h1>
          <p>Visit <a href="${process.env.CLIENT_URL}/verify/${signature}">your browser to enter your OTP</a></p>
        `,
      };

      try {
        await sgMail.send(emailData);
      } catch (err) {
        console.log(err);
      } 

      return res.status(201).json({
        msg: "User created successfully, check your email for verification",
        signature,
        verified: registeredUser!.verified,
      });
    }
  } catch (error: any) {
    console.log("registration error==> ", error);
    return res.status(500).json({ error: error.message });
  }
};

export const verifyUser = async (req: Request, res: Response) => {
  try {
    const token = req.params.signature;
    const decode = await verifySignature(token);

    // check if the user is a registered user
    const registeredUser = await User.findOne({
      where: { email: decode.email },
    });

    if (!registeredUser) {
      return res.status(400).json({
        Error: "Invalid credential or OTP already expired",
      });
    } else {
      const { otp } = req.body;
      if (
        registeredUser.otp === parseInt(otp) &&
        registeredUser.expiry! >= new Date()
      ) {
        const updatedUser = await User.findByIdAndUpdate(registeredUser._id, {
          verified: true,
        });

        // Regenerate a new signature
        let signature = await GenerateSignature({
          id: updatedUser!._id,
          email: updatedUser!.email,
        });
        if (updatedUser) {
          const UserVerified = await User.findOne({
            where: { email: decode.email },
          });

          return res.status(200).json({
            message: "You have successfully verified your account",
            signature,
            verified: UserVerified!.verified,
          });
        }
      }
    }
  } catch (error: any) {
    console.log("verification error==> ", error);
    return res.status(500).json({ error: error.message });
  }
};

export const Login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // check if the user exist
    const existUser = await User.findOne( { email },
    );
    console.log("existUser", existUser)
    if (!existUser) {
      return res.status(400).json({
        Error: "Wrong email or not a verified user",

        // Error: "Wrong email or password or not a verified user 204",
      });
    } else if (existUser!.verified === true) {
      const validation = await bcrypt.compare(password, existUser!.password);
      // const validation = await bcrypt.compare(existUser!.password, password);
console.log("validation", validation);
      if (!validation) {
        return res.status(400).json({
          Error: "Wrong password or not a verified user",
        });
      } 
      if (validation) {
        let signature = await GenerateSignature({
          id: existUser!._id,
          email: existUser!.email,
        });

        return res.status(200).json({
          message: "You have successfully logged in",
          signature,
          email: existUser!.email,
          verified: existUser!.verified,
          role: existUser!.role,
        });
      }
    }
  } catch (error: any) {
    console.log("login error==> ", error);
    return res.status(500).json({ error: error.message });
  }
};

export const Myprofile = async (req: JwtPayload, res: Response) => {
  try {
    const { email } = req.user;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        Error: "Invalid credentials",
      });
    }

    return res.status(200).json({
      message: "Your Profile",
      email: user!.email,
      role: user!.role,
    });
  } catch (error: any) {
    console.log("My profile error==> ", error);
    return res.status(500).json({ error: error.message });
  }
};

export const Updateprofile = async (req: JwtPayload, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
    });
    if (!user) {
      return res.status(400).json({
        Error: "Invalid credentials",
      });
    }

    user!.password = undefined as any;
    return res.status(200).json({
      message: "Your Profile",
      user,
    });
  } catch (error: any) {
    console.log("Update my profile error==> ", error);
    return res.status(500).json({ error: error.message });
  }
};

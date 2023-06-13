import { Request, Response } from "express";
import sgMail from "@sendgrid/mail";
import { JwtPayload } from "jsonwebtoken";
import User from "../models/users";
import { clientSchema, option, verifySignature } from "../utils/utils";
import {
  CLIENT_URL,
  FROM_EMAIL,
  GenerateOTP,
  SENDGRID_KEY,
  fromAdminMail,
  generateRandomPassword,
  userSubject,
  JWT_EXPIRE,
} from "../config";
import { emailHtml, mailsent, onPasswordReset, onRequestOTP } from "../utils";
sgMail.setApiKey(SENDGRID_KEY);

export const Createuser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    const isNotVerified = await User.findOne({ email, verified: false });
    if (isNotVerified) {
      return res
        .status(400)
        .json({ message: "PLease verify your account or request for an otp" });
    }

    const existingUser = await User.findOne({ email, verified: true });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    } else {
      const { otp, expiry } = GenerateOTP();

      //send sms to the registered user phone number
      const sms = await onRequestOTP(otp, phoneNumber);

      const newUser = await User.create({
        email,
        phoneNumber,
        password,
        firstName,
        lastName,
        otp,
        expiry,
        verified: false,
        role: "user",
      });
      console.log("newUser===> ", newUser);

      return res.status(201).json({
        msg: `${firstName} ${lastName} account created successfully, check your email for verification`,
        User: newUser,
      });
    }
  } catch (error: any) {
    console.log("registration error==> ", error);
    return res.status(500).json({ error: error.message });
  }
};

export const verifyUser = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    // check if the user is a registered user
    const registeredUser = await User.findOne({
      where: { email },
    });

    if (!registeredUser) {
      return res.status(400).json({
        Error: "Invalid credential or OTP already expired",
      });
    } else {
      if (
        registeredUser.otp === parseInt(otp) &&
        registeredUser.expiry! >= new Date()
      ) {
        const updatedUser = await User.findByIdAndUpdate(registeredUser._id, {
          verified: true,
        });

        // Regenerate a new signature
        let signature = await registeredUser.getSignedJwtToken();

        const options = {
          expires: new Date(Date.now() + JWT_EXPIRE * 24 * 60 * 60 * 1000),
          httpOnly: true,
        };

        if (updatedUser) {
          const UserVerified = await User.findOne({
            where: { email },
          });

          return res.status(200).cookie("token", signature, options).json({
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

    const existUser = await User.findOne({ email, verified: true }).select(
      "+password"
    );
    if (!existUser) {
      return res.status(400).json({
        Error: "Invalid credentials or not a verified user",
      });
    }

    const isPassword = existUser.matchPassword(password);
    if (!isPassword) {
      return res.status(400).json({
        Error: "Invalid credentials or not a verified user",
      });
    }

    const signature = existUser.getSignedJwtToken();

    const options = {
      expires: new Date(Date.now() + JWT_EXPIRE * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    return res.status(200).cookie("token", signature, options).json({
      message: "You have successfully logged in",
      signature,
      existUser,
    });
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
      Profile: user,
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
      runValidators: true,
    });
    if (!user) {
      return res.status(400).json({
        Error: "Invalid credentials",
      });
    }

    // user!.password = undefined as any;
    return res.status(200).json({
      message: "Your Profile",
      Profile: user,
    });
  } catch (error: any) {
    console.log("Update my profile error==> ", error);
    return res.status(500).json({ error: error.message });
  }
};

export const Deleteprofile = async (req: JwtPayload, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.user._id);
    if (!user) {
      return res.status(400).json({
        Error: "Invalid credentials",
      });
    }

    return res.status(200).json({
      message: "Your Profile deleted",
    });
  } catch (error: any) {
    console.log("Delete my profile error==> ", error);
    return res.status(500).json({ error: error.message });
  }
};

export const ForgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email address provided" });
    }

    // send the new password to this email
    //  1. auto generate a password
    const newPassword = generateRandomPassword(6);
    //  2. result the password in the database to the auto=password
    const dbPassword = user.updateOne({ password: newPassword });
    // 3. send a mail to the user to change his/her password from the send password
    const newpassword = await onPasswordReset(newPassword, user.phoneNumber);

    const emailData = {
      to: email,
      from: FROM_EMAIL,
      subject: "OTP",
      html: `
          <h1>Hi ${user.firstName} ${user.lastName}, Your new <strong>Password<strong> is: <span style="color:cyan;">${newPassword}</span></h1>
         <p>Please Login in and change your password on your dashboard.</p>
        `,
    };

    (async () => {
      try {
        await sgMail.send(emailData);
      } catch (error: any) {
        console.error(error);

        if (error.response) {
          console.error(error.response.body);
        }
      }
    })();

    return res.status(201).json({
      success: true,
    });
  } catch (error: any) {
    console.log("Forgot password error==> ", error);
    return res.status(500).json({ error: error.message });
  }
};

export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const verifiedUser = await User.findOne({ email, verified: true });
    if (verifiedUser) {
      return res
        .status(400)
        .json({ message: "User already verified,Please Login in" });
    }

    const isNotVerified = await User.findOne({ email, verified: false });
    if (!isNotVerified) {
      return res
        .status(400)
        .json({ message: "Invalid credentials, check the mail you provided" });
    }

    const { otp, expiry } = GenerateOTP();

    const user = await User.updateOne(
      {email},
      { otp, expiry }
    );
console.log("otp", otp)
    const sms = await onRequestOTP(otp, isNotVerified!.phoneNumber);

    const signature = await isNotVerified.getSignedJwtToken();
    const options = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      // new Date(Date.now() + JWT_EXPIRE * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    // const emailData = {
    //   to: email,
    //   from: FROM_EMAIL,
    //   subject: "OTP",
    //   html: `
    //       <h1>Hi ${isNotVerified.firstName} ${isNotVerified.lastName}, Your OTP status is: <span style="color:cyan;">${otp}</span></h1>
    //        <p>Visit <a href="${CLIENT_URL}/verify/${signature}">your browser to enter your OTP</a></p>
    //     `,
    // };

    // (async () => {
    //   try {
    //     await sgMail.send(emailData);
    //   } catch (error: any) {
    //     console.error(error);

    //     if (error.response) {
    //       console.error(error.response.body);
    //     }
    //   }
    // })();

    return res
      .status(201)
      .cookie("token", signature, options)
      .json({
        msg: `${isNotVerified.firstName} ${isNotVerified.lastName}, a new OTP has been sent, check your email for verification`,
        signature,
      });
  } catch (error: any) {
    console.log("Update otp error==> ", error);
    return res.status(500).json({ error: error.message });
  }
};

export const Createclient = async (req: JwtPayload, res: Response) => {
  try {
    const { image, age, height, weight, genotype, role, bloodGroup, address } =
      req.body;

    const validateResult = clientSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }

    const client = await User.findByIdAndUpdate(
      req.user._id,
      {
        image,
        age,
        height,
        weight,
        genotype,
        bloodGroup,
        address,
        role,
      },
      { new: true }
    );
    return res.status(201).json({
      message: `You are now a ${client!.role}`,
      Detail: client,
    });
  } catch (error: any) {
    console.log("Client registration error==> ", error);
    return res.status(500).json({ error: error.message });
  }
};

export const Findusers = async (req: JwtPayload, res: Response) => {
  try {
    const allUsers = await User.find({ role: "user" });

    return res.status(200).json({
      Users: allUsers,
    });
  } catch (error: any) {
    console.log("All users details error==> ", error);
    return res.status(500).json({ error: error.message });
  }
};
export const Finddonors = async (req: JwtPayload, res: Response) => {
  try {
    const allDonors = await User.find({ role: "donor" });

    return res.status(200).json({
      Donors: allDonors,
    });
  } catch (error: any) {
    console.log("All Donors details error==> ", error);
    return res.status(500).json({ error: error.message });
  }
};
export const Findsurrogates = async (req: JwtPayload, res: Response) => {
  try {
    const allSurrogates = await User.find({ role: "surrogate" });

    return res.status(200).json({
      Surrogates: allSurrogates,
    });
  } catch (error: any) {
    console.log("All surrogate details error==> ", error);
    return res.status(500).json({ error: error.message });
  }
};

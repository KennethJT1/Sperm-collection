import { Request, Response } from "express";
import sgMail from "@sendgrid/mail";
import { JwtPayload } from "jsonwebtoken";
import User from "../models/users";
import {
  GenerateSignature,
  clientSchema,
  option,
  registerSchema,
  verifySignature,
} from "../utils/utils";
import {
  CLIENT_URL,
  FROM_EMAIL,
  GenerateOTP,
  SENDGRID_KEY,
  generateRandomPassword,
} from "../config";
import { emailHtml, sendEmail } from "../utils";

sgMail.setApiKey(SENDGRID_KEY);

export const Createuser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const validateResult = registerSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }
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
      // const salt = await GenerateSalt();
      // const hashPassowrd = await bcrypt.hash(password, salt);

      const { otp, expiry } = GenerateOTP();

      const newUser = await User.create({
        email,
        password,
        firstName,
        lastName,
        otp,
        expiry,
        verified: false,
        role: "user",
      });
      console.log("newUser===> ", newUser);

      //Generate signature for user
      const signature = await newUser.getSignedJwtToken();

      const message = await emailHtml(otp)

      await sendEmail({
        email: newUser.email,
        subject: 'OTP',
        message
      })
      // const emailData = {
      //   to: email,
      //   from: FROM_EMAIL,
      //   subject: "OTP",
      //   html: `
      //     <h1>Hi ${firstName} ${lastName}, Your OTP status is: <span style="color:cyan;">${otp}</span></h1>
      //      <p>Visit <a href="${CLIENT_URL}/verify/${signature}">your browser to enter your OTP</a></p>
      //   `,
      // };


      return res.status(201).json({
        msg: `${firstName} ${lastName} account created successfully, check your email for verification`,
        signature,
        newUser,
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

    const existUser = await User.findOne({ email, verified: true }).select(
      "+password"
    );
    if (!existUser) {
      return res.status(400).json({
        Error: "Wrong email or password or not a verified user",
      });
    }

    const isPassword = existUser.matchPassword(password);
    if (!isPassword) {
      return res.status(400).json({
        Error: "Wrong email or password or not a verified user",
      });
    }

    const signature = existUser.getSignedJwtToken();

    return res.status(200).json({
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
    console.log("user", user);
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
      runValidators: true,
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
      email,
      { otp, expiry },
      {
        new: true,
      }
    );

    const signature = await isNotVerified.getSignedJwtToken();

    const emailData = {
      to: email,
      from: FROM_EMAIL,
      subject: "OTP",
      html: `
          <h1>Hi ${isNotVerified.firstName} ${isNotVerified.lastName}, Your OTP status is: <span style="color:cyan;">${otp}</span></h1>
           <p>Visit <a href="${CLIENT_URL}/verify/${signature}">your browser to enter your OTP</a></p>
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
      msg: `${isNotVerified.firstName} ${isNotVerified.lastName} a new OTP has been sent, check your email for verification`,
      signature,
    });
  } catch (error: any) {
    console.log("Update password error==> ", error);
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
      Detail: client
    });
  } catch (error: any) {
    console.log("Client registration error==> ", error);
    return res.status(500).json({ error: error.message });
  }
};

export const Findusers = async (req: JwtPayload, res: Response) => {
    try {
      const allUsers = await User.find({role: "user"});
  
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
      const allDonors = await User.find({role: "donor"});
  
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
      const allSurrogates = await User.find({role: "surrogate"});
  
      return res.status(200).json({
        Surrogates: allSurrogates,
      });
    } catch (error: any) {
      console.log("All surrogate details error==> ", error);
      return res.status(500).json({ error: error.message });
    }
  };
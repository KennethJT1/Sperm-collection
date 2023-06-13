import { Document, Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export interface UserDocument extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  image?: string;
  age?: number;
  height?: string;
  weight?: string;
  genotype?: string;
  bloodGroup?: string;
  address?: string;
  otp: number;
  verified: boolean;
  expiry: Date;
  role?: string[];
  matchPassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken: () => Promise<String>;
}

const userSchema = new Schema(
  {
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      trim: true,
      min: 5,
      max: 250,
      required: true,
      select: false,
    },
    image: { type: String },
    age: {
      type: Number,
    },
    height: {
      type: String,
    },
    weight: {
      type: String,
    },
    genotype: {
      type: String,
    },
    bloodGroup: {
      type: String,
    },
    address: {
      type: String,
    },
    otp: {
      type: Number,
      select: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expiry: {
      type: Date,
      select: false,
    },
    role: {
      type: String,
      default: ["user"],
      enum: ["user", "donor", "admin", "surrogate"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        delete ret.otp;
        delete ret.expiry;
        delete ret.createdAt;
        delete ret.updatedAt;
      }
    }
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//Match user entered password to hashed password in db
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate token
userSchema.methods.getSignedJwtToken = async function () {
  return await jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET!,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

export default model<UserDocument>("User", userSchema);

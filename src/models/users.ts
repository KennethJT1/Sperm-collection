import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    firstName: { type: String, trim: true, 
      required: [true, "Please add your first name"],
    },
    lastName: { type: String, trim: true, 
      required: [true, "Please add your last name"],
    },
    email: {
      type: String,
      unique: true,
      required: true
    },
    password: {
      type: String,
      trim: true,
      min: 5,
      max: 250,
      required: true,
    },
    otp: {
      type: Number,
    },
    verified: {
      type: Boolean,
     default: false,
    },
    expiry: {
      type: Date,
    },
    role: {
      type: String,
     default: "user",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if(!this.isModified('password')) {
    next();
  };


  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//Match user entered password to hashed password in db
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate token
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, email: this.email }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};



export default model("User", userSchema);

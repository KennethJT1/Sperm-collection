import express from "express";
import * as user from "../controller/authController";
import User from "../models/users";
import { requireSignin } from "../middlewares/auth";

const router = express.Router();

router.get("/", async (req, res) => {
  res.status(200).json("welcome");
});

router.post("/register", user.Createuser);
router.post("/verify/:signature", user.verifyUser);
router.post("/login",user.Login);
router.get("/profile",requireSignin,user.Myprofile);

export default router;

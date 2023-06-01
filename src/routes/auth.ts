import express from "express";
import * as user from "../controller/authController";
import { requireSignin } from "../middlewares/auth";

const router = express.Router();

router.post("/register", user.Createuser);
router.post("/verify/:signature", user.verifyUser);
router.post("/login",user.Login);
router.get("/my-profile",requireSignin,user.Myprofile);
router.put("/update-profile",requireSignin,user.Updateprofile);
router.delete("/delete-profile",requireSignin,user.Deleteprofile);
router.post("/forgot-password", user.ForgotPassword);
router.get("/resend-otp/:signature", user.resendOTP);
router.post("/create-client", user.Createclient);
router.get("/users", user.Findusers);
router.get("/donors", user.Finddonors);
router.get("/surrogate", user.Findsurrogates);

export default router;

import express from "express";
import dotenv from "dotenv";
import logger from "morgan";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";


import authRoute from "./routes/auth";

//env variable
dotenv.config();

const app = express();

// //Connect to mongoDB
export const db = mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.MONGODB_URL!)
  .then(() => console.log("Database is connected to mongoDB..."))
  .catch((err) => console.log("DB ERROR =>", err));

// //middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(logger("dev"));

// //Routes
app.use("/", authRoute);

//port
const port = process.env.PORT || 4900;

app.listen(port, () =>
  console.log(`Server is running on port http://localhost:${port}`)
);

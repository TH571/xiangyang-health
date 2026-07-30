import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDailyTip } from "./daily-tip";
import { uploadToOSS } from "./oss";

const prisma = new PrismaClient();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/version", (req, res) => {
  res.json({ version: "2.0.0", message: "All imports working!" });
});

export default app;
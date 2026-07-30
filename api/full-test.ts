import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

const app = express();

app.get("/api/full-test", (req, res) => {
  res.json({ ok: true, imports: "all" });
});

export default app;
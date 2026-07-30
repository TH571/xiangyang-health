import express from "express";

const app = express();

app.get("/api/version", (req, res) => {
  res.json({ version: "2.0.0", updated: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: { db: !!process.env.DATABASE_URL, oss: !!process.env.OSS_ACCESS_KEY_ID } });
});

export default app;
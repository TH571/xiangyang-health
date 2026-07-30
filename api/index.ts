import express from "express";

const app = express();

app.get("/api/version", (req, res) => {
  res.json({ version: "2.0.0", message: "Hello from Vercel!" });
});

export default app;
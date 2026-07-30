import express from "express";

const app = express();

app.get("/api/minimal", (req, res) => {
  res.json({ ok: true });
});

export default app;
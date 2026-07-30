import { createApp } from "../server/app";

const app = createApp();

app.get("/api/test-app", (req, res) => {
  res.json({ ok: true });
});

export default app;
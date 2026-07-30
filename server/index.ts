import { createServer } from "http";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "./app";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
const envPath = path.resolve(__dirname, "..", process.env.NODE_ENV === "production" ? ".env.production" : ".env");
dotenv.config({ path: envPath });

const app = createApp();
const server = createServer(app);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}/`);
});
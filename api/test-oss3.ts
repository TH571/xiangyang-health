import { uploadToOSS } from "../server/oss";

export default function handler(req: any, res: any) {
  res.json({ ok: true, uploadToOSS: typeof uploadToOSS });
}
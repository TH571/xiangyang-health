import { OSS_DOMAIN } from "../server/oss";

export default function handler(req: any, res: any) {
  res.json({ domain: OSS_DOMAIN });
}
import OSS from "ali-oss";
import path from "path";

const OSS_DOMAIN = process.env.OSS_DOMAIN || "https://xyjk-data.oss-cn-hangzhou.aliyuncs.com";

export default function handler(req: any, res: any) {
  res.json({ domain: OSS_DOMAIN, path: typeof path.extname });
}
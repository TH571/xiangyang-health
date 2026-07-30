import OSS from "ali-oss";

export default function handler(req: any, res: any) {
  try {
    const client = new OSS({
      region: "oss-cn-hangzhou",
      accessKeyId: "test",
      accessKeySecret: "test",
      bucket: "test",
    });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
import OSS from "ali-oss";
import path from "path";

let _ossClient: OSS | null = null;
function getOSSClient(): OSS {
  if (!_ossClient) {
    _ossClient = new OSS({
      region: "oss-cn-hangzhou",
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || "",
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || "",
      bucket: process.env.OSS_BUCKET || "xyjk-data",
      secure: true,
    });
  }
  return _ossClient;
}

export const OSS_DOMAIN = process.env.OSS_DOMAIN || "https://xyjk-data.oss-cn-hangzhou.aliyuncs.com";

export async function uploadToOSS(file: Buffer, filename: string, imageType: string = "default"): Promise<string> {
  const ext = path.extname(filename);
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1e9);
  const objectKey = `${imageType}/${timestamp}-${randomSuffix}${ext}`;
  const contentType = getContentType(ext);

  await getOSSClient().put(objectKey, file, {
    headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
  });
  return `${OSS_DOMAIN}/${objectKey}`;
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
    ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webm": "video/webm",
    ".ogg": "video/ogg", ".mov": "video/quicktime", ".avi": "video/x-msvideo",
    ".pdf": "application/pdf", ".txt": "text/plain",
  };
  return types[ext.toLowerCase()] || "application/octet-stream";
}

export async function deleteFromOSS(url: string): Promise<void> {
  const urlPath = url.replace(OSS_DOMAIN, "").replace(/^\//, "");
  await getOSSClient().delete(urlPath);
}
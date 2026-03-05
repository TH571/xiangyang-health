import OSS from "ali-oss";
import path from "path";

// OSS Configuration
const ossConfig = {
  region: "oss-cn-hangzhou",
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || "",
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || "",
  bucket: process.env.OSS_BUCKET || "xyjk-data",
  secure: true,
};

// Initialize OSS client
export const ossClient = new OSS(ossConfig);

// Domain for OSS resources
export const OSS_DOMAIN = process.env.OSS_DOMAIN || "https://xyjk-data.oss-cn-hangzhou.aliyuncs.com";

/**
 * Upload a file to OSS
 * @param file - Buffer of the file
 * @param filename - Original filename
 * @param imageType - Type of image (avatar, news, product, default)
 * @returns URL of the uploaded file
 */
export async function uploadToOSS(
  file: Buffer,
  filename: string,
  imageType: string = "default"
): Promise<string> {
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);

  // Create object key with type-based folder structure
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1e9);
  const objectKey = `${imageType}/${timestamp}-${randomSuffix}${ext}`;

  // 设置正确的 Content-Type
  const contentType = getContentType(ext);

  try {
    await ossClient.put(objectKey, file, {
      headers: {
        'Content-Type': contentType,
        // 设置缓存控制，1 年
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
    return `${OSS_DOMAIN}/${objectKey}`;
  } catch (error) {
    console.error("OSS upload error:", error);
    throw new Error("Failed to upload file to OSS");
  }
}

/**
 * Get content type based on file extension
 */
function getContentType(ext: string): string {
  const types: Record<string, string> = {
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    // Videos
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    // Documents
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return types[ext.toLowerCase()] || 'application/octet-stream';
}

/**
 * Delete a file from OSS
 * @param url - Full URL of the file
 */
export async function deleteFromOSS(url: string): Promise<void> {
  try {
    // Extract object key from URL
    const urlPath = url.replace(OSS_DOMAIN, "").replace(/^\//, "");
    await ossClient.delete(urlPath);
  } catch (error) {
    console.error("OSS delete error:", error);
    throw new Error("Failed to delete file from OSS");
  }
}

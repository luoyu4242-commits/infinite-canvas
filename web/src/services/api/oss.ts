import { nanoid } from "nanoid";

/** 上传本地文件并返回 HTTPS 公网地址；对应目录需允许公开读取并配置浏览器 CORS。 */
export async function uploadToOSS(file: File, directory: "images" | "audios" | "videos" = "images"): Promise<string> {
    const region = import.meta.env.VITE_OSS_REGION?.trim();
    const accessKeyId = import.meta.env.VITE_OSS_ACCESS_KEY_ID?.trim();
    const accessKeySecret = import.meta.env.VITE_OSS_ACCESS_KEY_SECRET?.trim();
    const bucket = import.meta.env.VITE_OSS_BUCKET?.trim();
    if (!region || !accessKeyId || !accessKeySecret || !bucket) {
        throw new Error("请先在 web/.env 中配置 VITE_OSS_REGION、VITE_OSS_ACCESS_KEY_ID、VITE_OSS_ACCESS_KEY_SECRET 和 VITE_OSS_BUCKET");
    }

    // VITE_* 会打包到浏览器，不能隐藏长期密钥；公开部署应改用服务端签发的 STS 临时凭证。
    // SDK 仅在实际上传时加载，避免增加首页的初始加载体积。
    const { default: OSS } = await import("ali-oss");
    const client = new OSS({ region, accessKeyId, accessKeySecret, bucket, secure: true });
    const extension = file.name.match(/\.[a-z0-9]+$/i)?.[0] || "";
    // 随机对象名避免同名文件覆盖，不把用户的原始文件名暴露在公网 URL 中。
    const result = await client.put(`${directory}/${nanoid()}${extension}`, file, { mime: file.type || undefined });
    return result.url;
}

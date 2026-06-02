/** 拼接 COS 公网对象 URL（路径含空格/中文时按段编码） */
export function buildCosPublicUrl(bucket: string, region: string, key: string): string {
  const encodedKey = key.split('/').map((part) => encodeURIComponent(part)).join('/');
  return `https://${bucket}.cos.${region}.myqcloud.com/${encodedKey}`;
}

const DEFAULT_COS_COVER_KEY = 'NEW VERSION TRY ON/封面.mp4';
const LOCAL_COVER_FALLBACK = '/cover.mp4';

export const COVER_VIDEO_SRC =
  import.meta.env.VITE_COVER_VIDEO_URL ||
  buildCosPublicUrl('lokada-1254090729', 'ap-shanghai', DEFAULT_COS_COVER_KEY);

export const COVER_VIDEO_FALLBACK = LOCAL_COVER_FALLBACK;

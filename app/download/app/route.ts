import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function extractBuildValue(content: string, key: 'versionCode' | 'versionName') {
  if (key === 'versionCode') {
    const match = content.match(/versionCode\s+(\d+)/);
    return match ? Number(match[1]) : null;
  }

  const match = content.match(/versionName\s+"([^"]+)"/);
  return match ? match[1] : null;
}

export async function GET() {
  const sourceApkFileName = 'LIONESSFIT.apk';
  const apkPath = path.join(process.cwd(), 'android', sourceApkFileName);
  const gradlePath = path.join(process.cwd(), 'android', 'app', 'build.gradle');

  try {
    const [fileBuffer, gradleContent] = await Promise.all([
      fs.readFile(apkPath),
      fs.readFile(gradlePath, 'utf-8'),
    ]);
    const versionCode = extractBuildValue(gradleContent, 'versionCode');
    const versionName = extractBuildValue(gradleContent, 'versionName');
    const downloadFileName =
      typeof versionCode === 'number' && typeof versionName === 'string'
        ? `LIONESSFIT-v${versionName}-b${versionCode}.apk`
        : sourceApkFileName;

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': `attachment; filename="${downloadFileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
        'Surrogate-Control': 'no-store',
      },
    });
  } catch {
    return new Response('APK nao encontrado.', { status: 404 });
  }
}

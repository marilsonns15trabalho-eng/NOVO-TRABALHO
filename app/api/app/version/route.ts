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
  const projectRoot = process.cwd();
  const gradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
  const apkFileName = 'LIONESSFIT.apk';
  const apkPath = path.join(projectRoot, 'android', apkFileName);

  try {
    const [gradleContent, apkStats] = await Promise.all([
      fs.readFile(gradlePath, 'utf-8'),
      fs.stat(apkPath),
    ]);

    const versionCode = extractBuildValue(gradleContent, 'versionCode');
    const versionName = extractBuildValue(gradleContent, 'versionName');

    if (typeof versionCode !== 'number' || typeof versionName !== 'string') {
      return Response.json(
        { error: 'Nao foi possivel identificar a versao atual do aplicativo.' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        },
      );
    }

    return Response.json(
      {
        versionCode,
        versionName,
        apkFileName,
        updatedAt: apkStats.mtime.toISOString(),
        downloadUrl: '/download/app',
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  } catch {
    return Response.json(
      { error: 'Versao do app indisponivel no momento.' },
      {
        status: 404,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  }
}

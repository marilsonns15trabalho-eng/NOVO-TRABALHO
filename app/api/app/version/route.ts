import { promises as fs } from 'fs';
import path from 'path';
import { getReleaseNotes } from '@/lib/app-release-notes';

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
  const sourceApkFileName = 'LIONESSFIT.apk';
  const apkPath = path.join(projectRoot, 'android', sourceApkFileName);

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

    const apkFileName = `LIONESSFIT-v${versionName}-b${versionCode}.apk`;

    return Response.json(
      {
        versionCode,
        versionName,
        apkFileName,
        updatedAt: apkStats.mtime.toISOString(),
        downloadUrl: `/download/app?v=${versionCode}&t=${apkStats.mtime.getTime()}`,
        releaseNotes: getReleaseNotes(versionName),
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

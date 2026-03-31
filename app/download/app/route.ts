import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apkFileName = 'LIONESSFIT.apk';
  const apkPath = path.join(process.cwd(), 'android', apkFileName);

  try {
    const fileBuffer = await fs.readFile(apkPath);

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': `attachment; filename="${apkFileName}"`,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    return new Response('APK nao encontrado.', { status: 404 });
  }
}

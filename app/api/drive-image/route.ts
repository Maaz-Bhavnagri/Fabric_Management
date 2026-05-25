import { NextRequest, NextResponse } from 'next/server';
import { getDriveService } from '@/lib/services/googleDriveService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('id');

  if (!fileId) {
    return new NextResponse('Missing file ID', { status: 400 });
  }

  try {
    const drive = getDriveService();

    // Fetch the file as a stream using the server OAuth2 credentials
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    const buffer = Buffer.from(response.data as ArrayBuffer);
    const contentType = (response.headers as Record<string, string>)['content-type'] || 'image/jpeg';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    const cause =
      typeof error === 'object' && error !== null && 'cause' in error
        ? (error as { cause?: { message?: string } }).cause
        : undefined;
    const invalidGrant =
      cause?.message === 'invalid_grant' ||
      (error instanceof Error && error.message.includes('invalid_grant'));
    if (invalidGrant) {
      console.error(
        '[drive-image] Google OAuth invalid_grant — re-authorize the app and set a fresh GOOGLE_REFRESH_TOKEN in .env',
      );
    } else {
      console.error('[drive-image] Failed to fetch image:', error);
    }
    return new NextResponse('Image not found', { status: 404 });
  }
}

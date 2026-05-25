import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseUser } from '@/lib/supabase/require-user';
import { toPublicErrorMessage } from '@/lib/api-errors';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const customerName = (formData.get('customerName') as string | null) || 'Customer';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Only image files are allowed (jpg, png, webp)' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File size must be under 10MB' }, { status: 400 });
    }

    // Check if Google Drive credentials are configured
    const hasDriveCredentials =
      !!process.env.GOOGLE_CLIENT_ID &&
      !!process.env.GOOGLE_CLIENT_SECRET &&
      !!process.env.GOOGLE_REFRESH_TOKEN &&
      !!process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

    if (!hasDriveCredentials) {
      console.warn('[measurements/upload] Google Drive OAuth2 not fully configured. Using fallback or returning error.');
      return NextResponse.json({
        success: false,
        driveNotConfigured: true,
        error: 'Google Drive not configured. Please add CLIENT_ID, CLIENT_SECRET, and REFRESH_TOKEN to .env.',
      }, { status: 200 });
    }

    const { uploadImage } = await import('@/lib/services/googleDriveService');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Slug: CustomerName_YYYY-MM-DD_measurement
    const safeName = customerName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30);
    const dateStr = new Date().toISOString().split('T')[0];
    const slug = `${safeName}_${dateStr}_measurement`;

    try {
      const result = await uploadImage(buffer, file.type, slug, 'Customers');

      return NextResponse.json({
        success: true,
        data: {
          photoUrl: result.webViewLink,
          photoFileId: result.fileId,
          photoName: `${slug}.jpg`,
        },
      });
    } catch (driveError: unknown) {
      const msg = driveError instanceof Error ? driveError.message : String(driveError);
      console.error('[measurements/upload] Google Drive error:', msg);
      return NextResponse.json({
        success: false,
        error: 'Google Drive upload failed. Your measurement text will still be saved.',
        details: msg,
      }, { status: 200 }); // non-fatal 200
    }
  } catch (error: unknown) {
    console.error('Measurement upload error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 }
    );
  }
}

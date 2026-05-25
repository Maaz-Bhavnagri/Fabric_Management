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

    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Slug: CustomerName_YYYY-MM-DD_measurement
    const safeName = customerName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30);
    const fileExt = file.name.split('.').pop() || 'webp';
    const fileName = `${safeName}_${Date.now()}_measurement.${fileExt}`;

    const { data: uploadData, error: uploadError } = await admin.storage
      .from('customer-measurements')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      console.error('[measurements/upload] Supabase upload failed:', uploadError);
      return NextResponse.json({
        success: false,
        error: 'Storage upload failed. Your measurement text will still be saved.',
        details: uploadError.message,
      }, { status: 200 }); // non-fatal 200
    }

    const { data: urlData } = admin.storage.from('customer-measurements').getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      data: {
        photoUrl: urlData.publicUrl,
        photoFileId: uploadData.path, // We store path as photoFileId so we can delete it later
        photoName: fileName,
      },
    });
  } catch (error: unknown) {
    console.error('Measurement upload error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseUser } from '@/lib/supabase/require-user';
import { toPublicErrorMessage } from '@/lib/api-errors';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fabricName = (formData.get('fabricName') as string | null) || 'Fabric';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Only image files are allowed' }, { status: 400 });
    }

    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Slug: FabricName_YYYY-MM-DD
    const safeName = fabricName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30);
    const fileExt = file.name.split('.').pop() || 'webp';
    const fileName = `${safeName}_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await admin.storage
      .from('fabric-images')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = admin.storage.from('fabric-images').getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: urlData.publicUrl,
        supabasePath: uploadData.path,
      },
    });
  } catch (error: unknown) {
    console.error('Inventory upload error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 }
    );
  }
}

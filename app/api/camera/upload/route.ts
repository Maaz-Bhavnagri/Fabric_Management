import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toPublicErrorMessage } from '@/lib/api-errors';
import crypto from 'crypto';

// POST - phone uploads captured photo (authenticated by device token)
export async function POST(request: Request) {
  try {
    const deviceToken = request.headers.get('x-device-token');

    if (!deviceToken) {
      return NextResponse.json({ success: false, error: 'Device token required' }, { status: 401 });
    }

    const tokenHash = crypto.createHash('sha256').update(deviceToken).digest('hex');
    const admin = createAdminClient();
    const { data: device, error: fe } = await admin
      .from('paired_devices')
      .select('id, admin_user_id')
      .eq('device_token_hash', tokenHash)
      .eq('is_active', true)
      .maybeSingle();
    if (fe) throw fe;

    if (!device) {
      return NextResponse.json({ success: false, error: 'Unauthorized device' }, { status: 401 });
    }

    await admin
      .from('paired_devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', device.id);

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    const context = (formData.get('context') as string) || 'general';
    const contextId = (formData.get('contextId') as string) || '';
    const requestId = (formData.get('requestId') as string) || crypto.randomUUID();

    if (!file) {
      return NextResponse.json({ success: false, error: 'Photo file required' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `camera/${device.admin_user_id}/${context}/${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } = await admin.storage
      .from('measurements')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Upload failed: ' + uploadError.message },
        { status: 500 },
      );
    }

    const { data: urlData } = admin.storage.from('measurements').getPublicUrl(uploadData.path);
    const publicUrl = urlData.publicUrl;

    try {
      const ch = admin.channel(`camera-device-${device.id}`);
      await ch.send({
        type: 'broadcast',
        event: 'photo_ready',
        payload: {
          requestId,
          url: publicUrl,
          context,
          contextId,
          deviceId: device.id,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch {
      console.warn('Realtime broadcast failed for photo_ready');
    }

    return NextResponse.json({
      success: true,
      data: { url: publicUrl, requestId, context, contextId },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: toPublicErrorMessage(error) }, { status: 500 });
  }
}

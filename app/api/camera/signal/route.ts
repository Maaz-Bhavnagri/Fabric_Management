import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSupabaseUser } from '@/lib/supabase/require-user';
import { toPublicErrorMessage } from '@/lib/api-errors';
import crypto from 'crypto';

// POST - admin laptop sends capture request to paired phone via Supabase Realtime
export async function POST(request: Request) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { deviceId, context, contextId, label } = body;

    if (!deviceId) {
      return NextResponse.json({ success: false, error: 'deviceId required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: device, error } = await admin
      .from('paired_devices')
      .select('id, admin_user_id, is_active, device_name')
      .eq('id', deviceId)
      .single();
    if (error) throw error;

    if (!device || device.admin_user_id !== auth.user.id || !device.is_active) {
      return NextResponse.json({ success: false, error: 'Device not found or not paired' }, { status: 404 });
    }

    const supabase = createAdminClient();
    const captureRequestId = crypto.randomUUID();

    const channel = supabase.channel(`camera-device-${deviceId}`, {
      config: {
        broadcast: { ack: true },
      },
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        supabase.removeChannel(channel);
        reject(new Error('Timeout connecting to realtime'));
      }, 5000);

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          try {
            await channel.send({
              type: 'broadcast',
              event: 'capture_request',
              payload: {
                requestId: captureRequestId,
                context: context || 'general',
                contextId: contextId || null,
                label: label || 'Take a Photo',
                timestamp: new Date().toISOString(),
              },
            });
            resolve();
          } catch (e) {
            reject(e);
          } finally {
            setTimeout(() => {
              supabase.removeChannel(channel);
            }, 500);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout);
          supabase.removeChannel(channel);
          reject(new Error(`Channel error: ${status}`));
        }
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        requestId: captureRequestId,
        deviceId,
        deviceName: device.device_name,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: toPublicErrorMessage(error) }, { status: 500 });
  }
}

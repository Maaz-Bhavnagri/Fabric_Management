import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toPublicErrorMessage } from '@/lib/api-errors';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Public endpoint - phone confirms pairing using the short-lived token from QR code
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, deviceName, browserInfo } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Pairing token required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: device, error: fe } = await admin
      .from('paired_devices')
      .select('*')
      .eq('pairing_token', token)
      .eq('is_active', false)
      .maybeSingle();
    if (fe) throw fe;

    if (!device) {
      return NextResponse.json({ success: false, error: 'Invalid or already-used pairing token' }, { status: 400 });
    }

    if (!device.pairing_token_expiry || new Date() > new Date(device.pairing_token_expiry)) {
      await admin.from('paired_devices').delete().eq('id', device.id);
      return NextResponse.json(
        { success: false, error: 'Pairing token has expired. Please scan a new QR code.' },
        { status: 400 },
      );
    }

    const deviceToken = crypto.randomUUID();
    const deviceTokenHash = crypto.createHash('sha256').update(deviceToken).digest('hex');

    const { data: updatedDevice, error: ue } = await admin
      .from('paired_devices')
      .update({
        is_active: true,
        device_token_hash: deviceTokenHash,
        pairing_token: null,
        pairing_token_expiry: null,
        device_name: deviceName || device.device_name,
        browser_info: browserInfo ?? null,
        last_seen: new Date().toISOString(),
      })
      .eq('id', device.id)
      .select('id, device_name, admin_user_id')
      .single();
    if (ue) throw ue;

    const realtime = createAdminClient();
    try {
      const channel = realtime.channel(`camera-admin-${device.admin_user_id}`, {
        config: {
          broadcast: { ack: true },
        },
      });

      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          realtime.removeChannel(channel);
          resolve();
        }, 3000);

        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            try {
              await channel.send({
                type: 'broadcast',
                event: 'pair_success',
                payload: {
                  deviceId: updatedDevice.id,
                  deviceName: updatedDevice.device_name,
                  pairedAt: new Date().toISOString(),
                },
              });
            } catch (e) {
              console.warn('Realtime broadcast failed for pair_success', e);
            } finally {
              setTimeout(() => {
                realtime.removeChannel(channel);
                resolve();
              }, 500);
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timeout);
            realtime.removeChannel(channel);
            resolve();
          }
        });
      });
    } catch (err) {
      console.warn('Realtime client initialization failed', err);
    }

    return NextResponse.json({
      success: true,
      data: {
        deviceId: updatedDevice.id,
        deviceToken,
        deviceName: updatedDevice.device_name,
        adminUserId: device.admin_user_id,
        realtimeChannel: `camera-device-${updatedDevice.id}`,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: toPublicErrorMessage(error) }, { status: 500 });
  }
}

// Public endpoint - phone verifies its stored device token is still valid
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceToken = searchParams.get('token');

    if (!deviceToken) {
      return NextResponse.json({ success: false, error: 'Token required' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(deviceToken).digest('hex');
    const admin = createAdminClient();
    const { data: device, error } = await admin
      .from('paired_devices')
      .select('id, device_name, admin_user_id, last_seen')
      .eq('device_token_hash', tokenHash)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;

    if (!device) {
      return NextResponse.json({ success: false, error: 'Device not recognized or revoked' }, { status: 401 });
    }

    await admin
      .from('paired_devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', device.id);

    return NextResponse.json({
      success: true,
      data: {
        deviceId: device.id,
        deviceName: device.device_name,
        adminUserId: device.admin_user_id,
        realtimeChannel: `camera-device-${device.id}`,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: toPublicErrorMessage(error) }, { status: 500 });
  }
}

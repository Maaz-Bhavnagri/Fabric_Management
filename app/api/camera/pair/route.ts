import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSupabaseUser } from '@/lib/supabase/require-user';
import { toPublicErrorMessage } from '@/lib/api-errors';
import crypto from 'crypto';

// GET - list all paired devices for admin
export async function GET() {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const admin = createAdminClient();
    const { data: devices, error } = await admin
      .from('paired_devices')
      .select('id, device_name, device_type, browser_info, last_seen, is_active, created_at')
      .eq('admin_user_id', auth.user.id)
      .order('last_seen', { ascending: false });
    if (error) throw error;

    const rows = (devices ?? []).map((d) => ({
      id: d.id,
      deviceName: d.device_name,
      deviceType: d.device_type,
      browserInfo: d.browser_info,
      lastSeen: d.last_seen,
      isActive: d.is_active,
      createdAt: d.created_at,
    }));

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: toPublicErrorMessage(error) }, { status: 500 });
  }
}

// POST - generate a new short-lived pairing token (QR code)
export async function POST(request: Request) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const deviceName = (body as { deviceName?: string }).deviceName || 'My Phone';

    const admin = createAdminClient();
    await admin
      .from('paired_devices')
      .delete()
      .eq('admin_user_id', auth.user.id)
      .eq('is_active', false)
      .lt('pairing_token_expiry', new Date().toISOString());

    const pairingToken = crypto.randomUUID();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    const { data: device, error } = await admin
      .from('paired_devices')
      .insert({
        admin_user_id: auth.user.id,
        device_name: deviceName,
        pairing_token: pairingToken,
        pairing_token_expiry: expiry.toISOString(),
        is_active: false,
      })
      .select('id')
      .single();
    if (error) throw error;

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;
    const pairingUrl = `${baseUrl}/camera/pair?token=${pairingToken}`;

    return NextResponse.json({
      success: true,
      data: {
        deviceId: device.id,
        pairingToken,
        pairingUrl,
        expiresAt: expiry.toISOString(),
        adminChannelId: auth.user.id,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: toPublicErrorMessage(error) }, { status: 500 });
  }
}

// DELETE - remove/revoke a paired device
export async function DELETE(request: Request) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('id');

    if (!deviceId) {
      return NextResponse.json({ success: false, error: 'Device ID required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: device } = await admin
      .from('paired_devices')
      .select('admin_user_id')
      .eq('id', deviceId)
      .single();

    if (!device || device.admin_user_id !== auth.user.id) {
      return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
    }

    const { error } = await admin.from('paired_devices').delete().eq('id', deviceId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: toPublicErrorMessage(error) }, { status: 500 });
  }
}

// PATCH - rename a device
export async function PATCH(request: Request) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('id');
    const body = await request.json();

    if (!deviceId || !(body as { deviceName?: string }).deviceName) {
      return NextResponse.json({ success: false, error: 'Device ID and name required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: device } = await admin
      .from('paired_devices')
      .select('admin_user_id')
      .eq('id', deviceId)
      .single();

    if (!device || device.admin_user_id !== auth.user.id) {
      return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
    }

    const { data: updated, error } = await admin
      .from('paired_devices')
      .update({ device_name: (body as { deviceName: string }).deviceName })
      .eq('id', deviceId)
      .select('id, device_name')
      .single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: { id: updated.id, deviceName: updated.device_name },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: toPublicErrorMessage(error) }, { status: 500 });
  }
}

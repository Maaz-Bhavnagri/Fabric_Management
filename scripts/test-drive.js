require('dotenv').config({ path: '.env' });
const { google } = require('googleapis');

async function testDrive() {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;
  const refresh_token = process.env.GOOGLE_REFRESH_TOKEN;
  const folderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  console.log('\n=== Drive OAuth2 Audit ===');
  console.log('client_id:', client_id ? 'EXISTS' : 'MISSING');
  console.log('folderId:', folderId);

  if (!client_id || !refresh_token) {
    console.error('❌ Missing OAuth2 credentials in .env');
    return;
  }

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3000/api/auth/google/callback'
  );
  oauth2Client.setCredentials({ refresh_token });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Step 1: List files in root folder
  console.log('\n[Step 1] Listing files in root folder...');
  try {
    const r = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType)',
      spaces: 'drive',
    });
    console.log('SUCCESS - items:', r.data.files?.length ?? 0);
    (r.data.files || []).forEach(f => console.log('  ', f.mimeType === 'application/vnd.google-apps.folder' ? '[FOLDER]' : '[FILE]', f.name));
  } catch (e) {
    console.log('FAIL listing root:', e.code, e.message);
  }

  // Step 2: Try uploading a tiny test file
  console.log('\n[Step 2] Uploading test file to personal quota...');
  const { Readable } = require('stream');
  const buf = Buffer.from('test image data - should be in personal 2TB');
  const stream = new Readable();
  stream.push(buf);
  stream.push(null);

  try {
    const result = await drive.files.create({
      requestBody: { name: 'OAUTH2_TEST_SUCCESS.txt', parents: [folderId] },
      media: { mimeType: 'text/plain', body: stream },
      fields: 'id, webViewLink',
    });
    console.log('✅ SUCCESS - Upload worked using personal quota!');
    console.log('  File ID:', result.data.id);
    console.log('  Link:', result.data.webViewLink);

    // Step 3: Delete the test file
    await drive.files.delete({ fileId: result.data.id });
    console.log('  Test file cleaned up.');
  } catch (e) {
    console.log('❌ FAIL upload:', e.code, e.status);
    console.log('  Message:', e.message);
  }
}

testDrive().catch(console.error);

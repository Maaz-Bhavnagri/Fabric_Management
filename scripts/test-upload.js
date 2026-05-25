require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function testUpload() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n=== Upload Test ===');

  const testBuf = Buffer.from('fake-image-data-for-test');
  const path = `customers/test_customer_${Date.now()}.jpg`;

  const { data, error } = await supabase.storage
    .from('measurements')
    .upload(path, testBuf, { contentType: 'image/jpeg', upsert: false });

  if (error) {
    console.error('❌ Upload failed:', error.message);
    return;
  }

  console.log('✅ Upload succeeded! Path:', data.path);

  const { data: urlData } = supabase.storage.from('measurements').getPublicUrl(data.path);
  console.log('✅ Public URL:', urlData.publicUrl);

  // Cleanup
  await supabase.storage.from('measurements').remove([data.path]);
  console.log('✅ Test file cleaned up.');
}

testUpload().catch(console.error);

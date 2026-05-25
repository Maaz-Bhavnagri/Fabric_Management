require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function setup() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n=== Supabase Storage Setup ===');

  // List existing buckets
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error('Cannot list buckets:', listErr.message);
    return;
  }
  console.log('Existing buckets:', buckets.map(b => b.name));

  const exists = buckets.some(b => b.name === 'measurements');
  if (exists) {
    console.log('✅ "measurements" bucket already exists.');
    return;
  }

  // Create bucket
  const { error: createErr } = await supabase.storage.createBucket('measurements', {
    public: true,           // public URLs work for photo links
    fileSizeLimit: 10485760, // 10 MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  });

  if (createErr) {
    console.error('❌ Failed to create bucket:', createErr.message);
  } else {
    console.log('✅ Created "measurements" bucket (public, 10MB limit).');
  }
}

setup().catch(console.error);

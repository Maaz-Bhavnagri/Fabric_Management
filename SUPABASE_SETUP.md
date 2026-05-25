# Supabase Setup Guide for Fabric Store

This project is configured to use **Supabase PostgreSQL** via Prisma. Supabase provides powerful Authentication and Row Level Security (RLS) out of the box.

## 1. Environment Variables
Ensure the following variables are present in your `.env.local` or `.env`:

```env
# Connection string with connection pooling (uses port 6543, pgbouncer=true)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection for Prisma Migrations
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Supabase Auth Keys
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## 2. Row Level Security (RLS)

Since Prisma bypasses RLS by default (it uses the Service Role / Admin connection), securing data access is handled primarily by your Next.js Server Actions / API Routes. 

However, if you plan to query data directly from the client using `@supabase/supabase-js`, you **must** enable RLS in the Supabase SQL editor:

```sql
-- Enable RLS on all tables
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fabric_designs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fabric_variants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stitch_orders" ENABLE ROW LEVEL SECURITY;

-- Owner Access Policy (Example)
-- Since this is an owner-only system, we can create a policy that simply says:
-- "If the user is authenticated, they can do everything"
CREATE POLICY "Allow full access for authenticated users"
ON "fabric_designs"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Repeat this policy for all other tables if you rely on Supabase Client directly.
```

## 3. Creating the Owner Profile trigger

If you want the `profiles` table to automatically populate when the owner signs up via Supabase Auth, run this in the Supabase SQL Editor:

```sql
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'owner');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 4. Running Migrations

Once your environment variables are set up, run:
```bash
# Push schema to Supabase and track migrations
npx prisma migrate dev --name init

# Seed the initial fabric data
npx prisma db seed
```

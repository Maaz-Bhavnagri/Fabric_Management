-- Stitch types + junction table.
-- IDs are TEXT to match existing public.invoice_items.id (Prisma String/uuid stored as text).
-- If a previous run created UUID columns, drop first (only if you have no data to keep):

DROP TABLE IF EXISTS public.invoice_item_stitch_types;
DROP TABLE IF EXISTS public.stitch_types;

CREATE TABLE public.stitch_types (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  name TEXT NOT NULL UNIQUE,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX stitch_types_name_idx ON public.stitch_types (name);

CREATE TABLE public.invoice_item_stitch_types (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  invoice_item_id TEXT NOT NULL REFERENCES public.invoice_items (id) ON DELETE CASCADE,
  stitch_type_id TEXT NOT NULL REFERENCES public.stitch_types (id) ON DELETE CASCADE,
  CONSTRAINT invoice_item_stitch_types_invoice_item_id_stitch_type_id_key UNIQUE (invoice_item_id, stitch_type_id)
);

CREATE INDEX invoice_item_stitch_types_stitch_type_id_idx
  ON public.invoice_item_stitch_types (stitch_type_id);

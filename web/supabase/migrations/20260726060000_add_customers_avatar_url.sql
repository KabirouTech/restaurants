-- The unified inbox has selected `customers.avatar_url` since 2026-02-15
-- (commit 63c03bd) but the column was never created — `customers` only ever had
-- avatar_url on `profiles`. PostgREST answered every inbox query with
--     42703: column customers_1.avatar_url does not exist
-- and the page discarded the error, so the inbox rendered "Aucune conversation"
-- for five months while messages were landing correctly in the table.
--
-- Additive and idempotent. The UI already falls back to initials when the value
-- is null, so this unblocks the query without needing any backfill.

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN customers.avatar_url IS 'Profile picture URL for the customer (e.g. Instagram). Null renders initials.';

-- Inbound media is now archived at webhook receipt, so the bucket has to hold
-- what customers actually send, not just what the composer uploads. WhatsApp
-- allows video up to 16 MB and documents well beyond that; the 10 MB ceiling
-- set for outbound attachments would silently drop them.
--
-- The ingest path caps itself at 50 MB and records `ingest_error` on anything
-- larger, so this matches that ceiling rather than exceeding it.
--
-- Idempotent: an UPDATE of an existing row.

UPDATE storage.buckets
SET
    file_size_limit = 52428800, -- 50 MB
    allowed_mime_types = ARRAY[
        'image/jpeg','image/png','image/webp','image/gif',
        'application/pdf',
        'audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/webm','audio/aac','audio/amr',
        'video/mp4','video/3gpp','video/quicktime',
        'application/octet-stream'
    ]
WHERE id = 'message-attachments';

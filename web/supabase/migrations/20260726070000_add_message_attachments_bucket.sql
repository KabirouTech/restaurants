-- Storage for outbound message attachments.
--
-- `messages.attachments` has existed since the initial schema and inbound
-- webhooks populate it, but nothing ever wrote to it from the dashboard side —
-- the composer's paperclip button had no handler at all. This bucket backs it.
--
-- Uploads go through a server action on the service role, so no INSERT policy
-- is needed here; reads are public because Meta fetches the media by URL when
-- relaying it to WhatsApp/Instagram.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'message-attachments',
    'message-attachments',
    true,
    10485760, -- 10 MB, matching the complaints bucket
    ARRAY[
        'image/jpeg','image/png','image/webp','image/gif',
        'application/pdf',
        'audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/webm',
        'video/mp4'
    ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_message_attachments" ON storage.objects;
CREATE POLICY "public_read_message_attachments" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'message-attachments');

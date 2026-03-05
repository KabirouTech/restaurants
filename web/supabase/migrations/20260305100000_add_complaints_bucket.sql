-- Create the complaints storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'complaints',
    'complaints',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg','image/png','image/webp','image/gif','audio/webm','audio/mp3','audio/mpeg','audio/ogg','audio/wav','audio/mp4','audio/aac']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to complaints bucket
CREATE POLICY "authenticated_upload_complaints" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'complaints');

-- Allow public read access to complaints files
CREATE POLICY "public_read_complaints" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'complaints');

-- Allow authenticated users to update their own uploads
CREATE POLICY "authenticated_update_complaints" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'complaints');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "authenticated_delete_complaints" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'complaints');

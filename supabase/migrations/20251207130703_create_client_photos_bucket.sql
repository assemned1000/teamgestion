-- Create the client-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-photos',
  'client-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- Create storage policy to allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload client photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-photos');

-- Create storage policy to allow public read access
CREATE POLICY "Allow public read access to client photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'client-photos');

-- Create storage policy to allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated users to update client photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'client-photos');

-- Create storage policy to allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete client photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client-photos');
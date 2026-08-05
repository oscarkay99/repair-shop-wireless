-- The branding bucket (business logo) had no allowed_mime_types or
-- file_size_limit at all — unlike repair-media, which restricts both. Any
-- file type an admin uploaded was accepted and served publicly, including
-- image/svg+xml, which can carry an inline <script> that executes if the
-- object URL is opened directly in a browser (the app itself only ever
-- renders it via <img src>, which doesn't execute embedded scripts, but
-- the public object URL itself is a real gap regardless of how the app
-- currently uses it).

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'],
    file_size_limit = 2097152 -- 2MB, generous for a logo
where id = 'branding';

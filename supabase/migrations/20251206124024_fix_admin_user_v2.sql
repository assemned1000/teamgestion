/*
  # Correction de l'utilisateur admin v2
  
  1. Suppression
    - Supprime l'ancien utilisateur admin s'il existe
  
  2. Recréation
    - Crée un nouvel utilisateur admin correctement
*/

-- Supprimer l'ancien utilisateur admin
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@demo.com');
DELETE FROM auth.users WHERE email = 'admin@demo.com';
DELETE FROM profiles WHERE email = 'admin@demo.com';

-- Créer le nouvel utilisateur admin
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  new_user_id := gen_random_uuid();
  
  -- Insérer dans auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'admin@demo.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  -- Créer le profil
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    role
  ) VALUES (
    new_user_id,
    'admin@demo.com',
    'Admin',
    'Système',
    'admin'
  );
  
  -- Créer une identité pour l'utilisateur
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', 'admin@demo.com'
    ),
    'email',
    new_user_id::text,
    now(),
    now(),
    now()
  );
END $$;

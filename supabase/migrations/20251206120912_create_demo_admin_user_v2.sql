/*
  # Création d'un utilisateur admin de démonstration
  
  1. Création
    - Crée un utilisateur admin avec email: admin@demo.com
    - Mot de passe: admin123
    - Rôle: admin
  
  2. Sécurité
    - Utilisateur pour démonstration uniquement
*/

DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Générer un UUID pour l'utilisateur
  user_id := gen_random_uuid();
  
  -- Vérifier si l'utilisateur existe déjà
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@demo.com') THEN
    -- Insérer l'utilisateur dans auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    )
    VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@demo.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );
    
    -- Créer le profil associé
    INSERT INTO profiles (
      id,
      email,
      first_name,
      last_name,
      role
    )
    VALUES (
      user_id,
      'admin@demo.com',
      'Admin',
      'Système',
      'admin'
    );
  END IF;
END $$;

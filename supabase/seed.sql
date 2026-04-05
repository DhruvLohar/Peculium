-- ════════════════════════════════════════════════════════════════════════════
-- Seed Data for Peculium - Test User with 80 Transactions
-- ════════════════════════════════════════════════════════════════════════════
-- Email: test@peculium.com
-- Password: Set this manually in Supabase Dashboard or via auth.users insert
-- Transactions: 80 entries spread over last 3 weeks with micro-transactions
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Create test user in auth.users (Supabase Auth)
-- Note: You'll need to set the password via Supabase Dashboard or use proper hashing
-- This creates a user with email test@peculium.com
-- The trigger will automatically create a profile entry

DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Insert user into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test@peculium.com',
    crypt('TestPassword123!', gen_salt('bf')), -- Password: TestPassword123!
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Test User"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO test_user_id;

  -- If user already exists, get their ID
  IF test_user_id IS NULL THEN
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@peculium.com';
  END IF;

  -- Update profile to mark as onboarded
  UPDATE public.profiles 
  SET has_onboarded = true 
  WHERE id = test_user_id;

  -- 2. Insert 80 transactions spread over last 3 weeks
  -- Week 3 (oldest - 21 to 15 days ago)
  INSERT INTO public.transactions (user_id, type, amount, category, transaction_date, notes) VALUES
  (test_user_id, 'INCOME', 45000.00, 'Salary', NOW() - INTERVAL '21 days', 'Monthly salary'),
  (test_user_id, 'EXPENSE', 15000.00, 'Rent', NOW() - INTERVAL '21 days', 'House rent payment'),
  (test_user_id, 'EXPENSE', 20.00, 'Food', NOW() - INTERVAL '21 days', 'Vadapav from street stall'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '21 days', 'Chai at office'),
  (test_user_id, 'EXPENSE', 1250.00, 'Groceries', NOW() - INTERVAL '20 days', 'Weekly groceries - DMart'),
  (test_user_id, 'EXPENSE', 30.00, 'Food', NOW() - INTERVAL '20 days', 'Samosa and chai'),
  (test_user_id, 'EXPENSE', 80.00, 'Travel', NOW() - INTERVAL '20 days', 'Auto to office'),
  (test_user_id, 'EXPENSE', 15.00, 'Food', NOW() - INTERVAL '20 days', 'Evening chai'),
  (test_user_id, 'EXPENSE', 120.00, 'Food', NOW() - INTERVAL '19 days', 'Lunch - thali'),
  (test_user_id, 'EXPENSE', 50.00, 'Travel', NOW() - INTERVAL '19 days', 'Metro card recharge'),
  (test_user_id, 'EXPENSE', 25.00, 'Food', NOW() - INTERVAL '19 days', 'Pani puri'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '19 days', 'Morning chai'),
  (test_user_id, 'EXPENSE', 350.00, 'Health', NOW() - INTERVAL '18 days', 'Pharmacy - medicines'),
  (test_user_id, 'EXPENSE', 40.00, 'Food', NOW() - INTERVAL '18 days', 'Misal pav breakfast'),
  (test_user_id, 'EXPENSE', 20.00, 'Food', NOW() - INTERVAL '18 days', 'Vadapav'),
  (test_user_id, 'EXPENSE', 15.00, 'Food', NOW() - INTERVAL '18 days', 'Chai'),
  (test_user_id, 'EXPENSE', 180.00, 'Food', NOW() - INTERVAL '17 days', 'Dinner - Chinese'),
  (test_user_id, 'EXPENSE', 60.00, 'Travel', NOW() - INTERVAL '17 days', 'Uber to home'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '17 days', 'Chai'),
  (test_user_id, 'EXPENSE', 450.00, 'Other', NOW() - INTERVAL '16 days', 'Mobile recharge'),
  (test_user_id, 'EXPENSE', 20.00, 'Food', NOW() - INTERVAL '16 days', 'Vadapav'),
  (test_user_id, 'EXPENSE', 35.00, 'Food', NOW() - INTERVAL '16 days', 'Poha breakfast'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '16 days', 'Chai'),
  (test_user_id, 'EXPENSE', 150.00, 'Food', NOW() - INTERVAL '15 days', 'Lunch with colleague'),
  (test_user_id, 'EXPENSE', 25.00, 'Food', NOW() - INTERVAL '15 days', 'Bhel puri evening snack'),
  
  -- Week 2 (14 to 8 days ago)
  (test_user_id, 'EXPENSE', 20.00, 'Food', NOW() - INTERVAL '14 days', 'Vadapav'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '14 days', 'Morning chai'),
  (test_user_id, 'EXPENSE', 1850.00, 'Groceries', NOW() - INTERVAL '14 days', 'Monthly groceries - Big Bazaar'),
  (test_user_id, 'EXPENSE', 200.00, 'Travel', NOW() - INTERVAL '14 days', 'Petrol'),
  (test_user_id, 'EXPENSE', 15.00, 'Food', NOW() - INTERVAL '14 days', 'Cutting chai'),
  (test_user_id, 'EXPENSE', 45.00, 'Food', NOW() - INTERVAL '13 days', 'Dosa breakfast'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '13 days', 'Chai'),
  (test_user_id, 'EXPENSE', 600.00, 'Other', NOW() - INTERVAL '13 days', 'Electricity bill'),
  (test_user_id, 'EXPENSE', 30.00, 'Food', NOW() - INTERVAL '13 days', 'Vada pav + chai combo'),
  (test_user_id, 'EXPENSE', 500.00, 'Health', NOW() - INTERVAL '12 days', 'Doctor consultation'),
  (test_user_id, 'EXPENSE', 20.00, 'Food', NOW() - INTERVAL '12 days', 'Vadapav'),
  (test_user_id, 'EXPENSE', 90.00, 'Travel', NOW() - INTERVAL '12 days', 'Auto rickshaw'),
  (test_user_id, 'EXPENSE', 15.00, 'Food', NOW() - INTERVAL '12 days', 'Chai'),
  (test_user_id, 'EXPENSE', 1200.00, 'Other', NOW() - INTERVAL '11 days', 'WiFi bill'),
  (test_user_id, 'EXPENSE', 250.00, 'Food', NOW() - INTERVAL '11 days', 'Dinner - Pizza'),
  (test_user_id, 'EXPENSE', 20.00, 'Food', NOW() - INTERVAL '11 days', 'Vadapav'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '11 days', 'Chai'),
  (test_user_id, 'INCOME', 2500.00, 'Other', NOW() - INTERVAL '10 days', 'Freelance project payment'),
  (test_user_id, 'EXPENSE', 35.00, 'Food', NOW() - INTERVAL '10 days', 'Idli sambhar breakfast'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '10 days', 'Chai'),
  (test_user_id, 'EXPENSE', 800.00, 'Other', NOW() - INTERVAL '10 days', 'Netflix + Spotify subscription'),
  (test_user_id, 'EXPENSE', 20.00, 'Food', NOW() - INTERVAL '9 days', 'Vadapav'),
  (test_user_id, 'EXPENSE', 140.00, 'Food', NOW() - INTERVAL '9 days', 'Lunch - biryani'),
  (test_user_id, 'EXPENSE', 15.00, 'Food', NOW() - INTERVAL '9 days', 'Evening chai'),
  (test_user_id, 'EXPENSE', 50.00, 'Food', NOW() - INTERVAL '9 days', 'Pav bhaji'),
  (test_user_id, 'EXPENSE', 300.00, 'Health', NOW() - INTERVAL '8 days', 'Gym membership'),
  (test_user_id, 'EXPENSE', 20.00, 'Food', NOW() - INTERVAL '8 days', 'Vadapav'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '8 days', 'Chai'),
  
  -- Week 1 (7 days to today)
  (test_user_id, 'EXPENSE', 2200.00, 'Groceries', NOW() - INTERVAL '7 days', 'Weekly groceries + household items'),
  (test_user_id, 'EXPENSE', 20.00, 'Food', NOW() - INTERVAL '7 days', 'Vadapav'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '7 days', 'Morning chai'),
  (test_user_id, 'EXPENSE', 180.00, 'Travel', NOW() - INTERVAL '7 days', 'Weekly metro pass'),
  (test_user_id, 'EXPENSE', 40.00, 'Food', NOW() - INTERVAL '6 days', 'Upma breakfast'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '6 days', 'Chai'),
  (test_user_id, 'EXPENSE', 20.00, 'Food', NOW() - INTERVAL '6 days', 'Vadapav'),
  (test_user_id, 'EXPENSE', 350.00, 'Food', NOW() - INTERVAL '6 days', 'Dinner with friends'),
  (test_user_id, 'EXPENSE', 15.00, 'Food', NOW() - INTERVAL '6 days', 'Cutting chai'),
  (test_user_id, 'EXPENSE', 450.00, 'Other', NOW() - INTERVAL '5 days', 'Haircut + grooming'),
  (test_user_id, 'EXPENSE', 20.00, 'Food', NOW() - INTERVAL '5 days', 'Vadapav'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '5 days', 'Chai'),
  (test_user_id, 'EXPENSE', 120.00, 'Travel', NOW() - INTERVAL '5 days', 'Uber to mall'),
  (test_user_id, 'EXPENSE', 1500.00, 'Other', NOW() - INTERVAL '4 days', 'Shopping - clothes'),
  (test_user_id, 'EXPENSE', 30.00, 'Food', NOW() - INTERVAL '4 days', 'Samosa + chai'),
  (test_user_id, 'EXPENSE', 20.00, 'Food', NOW() - INTERVAL '4 days', 'Vadapav'),
  (test_user_id, 'EXPENSE', 280.00, 'Food', NOW() - INTERVAL '3 days', 'Lunch - restaurant'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '3 days', 'Morning chai'),
  (test_user_id, 'EXPENSE', 15.00, 'Food', NOW() - INTERVAL '3 days', 'Evening chai'),
  (test_user_id, 'EXPENSE', 25.00, 'Food', NOW() - INTERVAL '3 days', 'Sev puri'),
  (test_user_id, 'EXPENSE', 20.00, 'Food', NOW() - INTERVAL '2 days', 'Vadapav'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '2 days', 'Chai'),
  (test_user_id, 'EXPENSE', 850.00, 'Groceries', NOW() - INTERVAL '2 days', 'Quick grocery run'),
  (test_user_id, 'EXPENSE', 70.00, 'Travel', NOW() - INTERVAL '2 days', 'Auto fare'),
  (test_user_id, 'EXPENSE', 40.00, 'Food', NOW() - INTERVAL '1 day', 'Poha breakfast'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '1 day', 'Chai'),
  (test_user_id, 'EXPENSE', 20.00, 'Food', NOW() - INTERVAL '1 day', 'Vadapav'),
  (test_user_id, 'EXPENSE', 200.00, 'Food', NOW() - INTERVAL '1 day', 'Dinner - butter chicken'),
  (test_user_id, 'EXPENSE', 15.00, 'Food', NOW() - INTERVAL '1 day', 'Evening chai'),
  (test_user_id, 'EXPENSE', 10.00, 'Food', NOW() - INTERVAL '4 hours', 'Morning chai'),
  (test_user_id, 'EXPENSE', 20.00, 'Food', NOW() - INTERVAL '2 hours', 'Vadapav for lunch');

  RAISE NOTICE 'Seed data created successfully!';
  RAISE NOTICE 'Test user email: test@peculium.com';
  RAISE NOTICE 'Test user password: TestPassword123!';
  RAISE NOTICE 'User ID: %', test_user_id;
END $$;

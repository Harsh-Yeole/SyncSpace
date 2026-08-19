import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = postgres(process.env.DATABASE_URL as string);

const testTrigger = async () => {
  try {
    const id = uuidv4();
    console.log('Inserting into auth.users...');
    await client`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
        recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', ${id}, 'authenticated', 'authenticated', 
        'test_trigger@gmail.com', 'password', now(), now(), now(), '{}', '{"full_name":"Test Trigger"}', 
        now(), now(), '', '', '', ''
      )
    `;
    console.log('Inserted into auth.users');

    const res = await client`SELECT * FROM public.users WHERE id = ${id}`;
    console.log('Result from public.users:', res);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
};

testTrigger();

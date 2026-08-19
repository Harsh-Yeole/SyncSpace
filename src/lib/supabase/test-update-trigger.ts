import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = postgres(process.env.DATABASE_URL as string);

async function testTrigger() {
  try {
    // 1. Insert an anonymous user into auth.users to simulate an anonymous session
    const anonId = '00000000-0000-0000-0000-000000000001';
    console.log("Inserting anonymous user...");
    await client`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
        recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token, is_anonymous
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', ${anonId}, 'authenticated', 'authenticated', 
        null, 'password', null, null, null, '{}', '{}', 
        now(), now(), '', '', '', '', true
      )
    `;

    // 2. Check public.users to see if the anonymous user was added with blank email/name
    let publicUser = await client`SELECT * FROM public.users WHERE id = ${anonId}`;
    console.log("After INSERT, public.users row:", publicUser);

    // 3. Upgrade the anonymous user (update auth.users with email and full_name)
    console.log("Upgrading anonymous user to real user...");
    await client`
      UPDATE auth.users
      SET email = 'upgraded_user@example.com',
          raw_user_meta_data = '{"full_name":"Upgraded User"}',
          is_anonymous = false
      WHERE id = ${anonId}
    `;

    // 4. Check public.users again to see if the trigger fired and synced the details
    publicUser = await client`SELECT * FROM public.users WHERE id = ${anonId}`;
    console.log("After UPDATE, public.users row:", publicUser);

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await client.end();
  }
}

testTrigger();

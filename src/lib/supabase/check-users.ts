import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = postgres(process.env.DATABASE_URL as string);

async function check() {
  const authUsers = await client`SELECT id, email, raw_user_meta_data, created_at, updated_at FROM auth.users ORDER BY updated_at DESC LIMIT 5`;
  console.log('auth.users (latest updated 5):', JSON.stringify(authUsers, null, 2));
  
  const publicUsers = await client`SELECT id, email, full_name, avatar_url FROM public.users ORDER BY id DESC LIMIT 5`;
  console.log('public.users (latest 5):', JSON.stringify(publicUsers, null, 2));
  
  await client.end();
}

check();

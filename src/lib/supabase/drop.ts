import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const client = postgres(process.env.DATABASE_URL as string);
async function drop() {
  try {
    await client`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`;
    await client`DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;`;
    await client`DROP TRIGGER IF EXISTS handle_update_user ON auth.users;`;
    await client`DROP FUNCTION IF EXISTS public.handle_update_user() CASCADE;`;
    console.log('Dropped triggers');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
drop();

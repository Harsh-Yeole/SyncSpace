import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = postgres(process.env.DATABASE_URL as string);

const check = async () => {
  try {
    const res = await client`SELECT id, email, is_anonymous FROM auth.users ORDER BY created_at DESC LIMIT 5`;
    console.log('auth.users:', res);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
};

check();

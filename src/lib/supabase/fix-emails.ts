import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = postgres(process.env.DATABASE_URL as string);

const fixEmails = async () => {
  try {
    console.log('Fixing emails in public.users...');
    const authUsers = await client`SELECT * FROM auth.users`;
    console.log('auth.users:', authUsers);

    const publicUsers = await client`SELECT * FROM public.users`;
    console.log('public.users:', publicUsers);

    await client`
      UPDATE public.users 
      SET email = auth.users.email 
      FROM auth.users 
      WHERE public.users.id = auth.users.id AND public.users.email IS NULL;
    `;
    console.log('Updated emails!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
};

fixEmails();

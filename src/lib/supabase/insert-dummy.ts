import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = postgres(process.env.DATABASE_URL as string);

const insertDummyUser = async () => {
  try {
    const id = uuidv4();
    console.log('Inserting dummy user...');
    await client`
      INSERT INTO public.users (id, email, full_name, avatar_url) 
      VALUES (${id}, 'akash@gmail.com', 'Akash Patel', '')
    `;
    console.log('Dummy user added!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
};

insertDummyUser();

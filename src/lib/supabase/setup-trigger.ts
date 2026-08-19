import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = postgres(process.env.DATABASE_URL as string);

const setupTrigger = async () => {
  try {
    console.log('Creating trigger function...');
    await client`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.users (id, email, full_name, avatar_url)
        VALUES (
          new.id, 
          new.email, 
          COALESCE(new.raw_user_meta_data->>'full_name', ''), 
          COALESCE(new.raw_user_meta_data->>'avatar_url', '')
        );
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    console.log('Creating trigger...');
    await client`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    `;
    await client`
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `;

    console.log('Syncing existing users from auth.users to public.users...');
    await client`
      INSERT INTO public.users (id, email, full_name, avatar_url)
      SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', ''), COALESCE(raw_user_meta_data->>'avatar_url', '')
      FROM auth.users
      WHERE id NOT IN (SELECT id FROM public.users)
      ON CONFLICT (id) DO NOTHING;
    `;

    console.log('Setup complete!');
  } catch (error) {
    console.error('Error setting up trigger:', error);
  } finally {
    await client.end();
  }
};

setupTrigger();

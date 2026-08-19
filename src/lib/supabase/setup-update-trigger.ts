import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = postgres(process.env.DATABASE_URL as string);

const setupUpdateTrigger = async () => {
  try {
    console.log('Creating handle_update_user function...');
    await client`
      CREATE OR REPLACE FUNCTION public.handle_update_user()
      RETURNS trigger AS $$
      BEGIN
        UPDATE public.users
        SET 
          email = new.email,
          full_name = COALESCE(new.raw_user_meta_data->>'full_name', public.users.full_name),
          avatar_url = COALESCE(new.raw_user_meta_data->>'avatar_url', public.users.avatar_url)
        WHERE id = new.id;
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    console.log('Function handle_update_user created successfully!');

    console.log('Checking for existing trigger...');
    await client`DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;`;

    console.log('Creating trigger on_auth_user_updated...');
    await client`
      CREATE TRIGGER on_auth_user_updated
        AFTER UPDATE ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_update_user();
    `;
    console.log('Trigger created successfully!');

    // Also let's update any existing users right now just in case!
    console.log('Syncing any existing anonymous users who were upgraded...');
    await client`
      UPDATE public.users 
      SET 
        email = auth.users.email,
        full_name = COALESCE(auth.users.raw_user_meta_data->>'full_name', public.users.full_name),
        avatar_url = COALESCE(auth.users.raw_user_meta_data->>'avatar_url', public.users.avatar_url)
      FROM auth.users 
      WHERE public.users.id = auth.users.id AND public.users.email IS NULL AND auth.users.email IS NOT NULL;
    `;
    console.log('Database sync complete!');

  } catch (error) {
    console.error('Error setting up trigger:', error);
  } finally {
    await client.end();
  }
};

setupUpdateTrigger();

import { db } from "./src/lib/supabase/db";
import { users } from "./src/lib/supabase/schema";

async function check() {
    const allUsers = await db.select().from(users);
    console.log(allUsers);
}
check();

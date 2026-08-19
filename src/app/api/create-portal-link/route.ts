import { NextResponse } from "next/server";
import { createOrRetrieveCustomer } from "@/lib/stripe/adminTasks";
import { stripe } from "@/lib/stripe";
import { getURL } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/create-client";

export  async function POST() {
  try {
    const supabase =await createServerSupabaseClient();
    // console.log("SUPABASE", supabase);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found");

    const customer = await createOrRetrieveCustomer({
      email: user.email || "",
      uuid: user.id || "",
    });

    if (!customer) throw new Error("Customer not found");
    const { url } = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${getURL()}dashboard`,
    });
    return NextResponse.json({ url });
  } catch (error) {
    console.log(`Error : ${error}`);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

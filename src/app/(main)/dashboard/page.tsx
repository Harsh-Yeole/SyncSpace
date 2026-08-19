import DashboardSetup from "@/components/dashboard-setup/dashboard-setup";
import db from "@/lib/supabase/db";
import { getUserSubscriptionStatus } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import React from "react";
import { getAuthSession } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

const DashboardPage = async () => {
  const user = await getAuthSession();

  if (!user) return redirect("/login");
  const workspace = await db.query.workspaces.findFirst({
    where: (workspace, { eq }) => eq(workspace.workspaceOwner, user.id),
  });

  const { data: subscription, error: subscriptionError } =
    await getUserSubscriptionStatus(user.id);
  if (subscriptionError) return;

  if (!workspace) {
    return (
      <div
        className="bg-background
    h-screen
    w-screen
    flex
    justify-center
    items-center"
      >
        <DashboardSetup user={user} subscription={subscription} />
      </div>
    );
  }

  redirect(`/dashboard/${workspace.id}`);
};

export default DashboardPage;

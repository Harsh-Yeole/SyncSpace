import { getAuthSession } from "@/lib/auth/jwt";
import {
  getCollaboratingWorkspaces,
  getFolders,
  getPrivateWorkspaces,
  getSharedWorkspaces,
  getUserSubscriptionStatus,
} from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import React from "react";
import { twMerge } from "tailwind-merge";
import WorkspaceDropdown from "./workspace-dropdown";
import PlanUsage from "./plan-usage";
import NativeNavigation from "./native-navigation";
import { ScrollArea } from "../ui/scroll-area";
import FoldersDropdownList from "./folders-dropdown-list";
import { ModeToggle } from "../global/mode-toggle";

interface SidebarProps {
  params: { workspaceId: string };
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = async ({ params, className }) => {
  const { workspaceId } = await params;
  
  //check for user exist
  const user = await getAuthSession();

  if (!user) return null;

  //check the subsscription status
  const { data: subscriptionData, error: subscriptionError } =
    await getUserSubscriptionStatus(user.id);
  //check for folders
  const { data: workspaceFolderData, error: workspaceFolderError } =
    await getFolders(workspaceId);
  //handle error
  if (subscriptionError || workspaceFolderError) redirect("/dashboard");
  //get all diff workspaces: private, collaborating, shared
  const [privateWorkspace, collaboratingWorkspace, sharedWorkspace] =
    await Promise.all([
      getPrivateWorkspaces(user.id),
      getCollaboratingWorkspaces(user.id),
      getSharedWorkspaces(user.id),
    ]);

  return (
    <aside
      className={twMerge(
        "hidden sm:flex sm:flex-col w-[280px] shrink-0 p-4 md:gap-4 !justify-between",
        className
      )}
    >
      <div>
        <WorkspaceDropdown
          privateWorkspace={privateWorkspace}
          sharedWorkspace={sharedWorkspace}
          collaboratingWorkspace={collaboratingWorkspace}
          defaltValue={[
            ...privateWorkspace,
            ...sharedWorkspace,
            ...collaboratingWorkspace,
          ].find((workspace) => workspace.id === workspaceId)}
        />
        <PlanUsage
          foldersLength={workspaceFolderData?.length || 0}
          subscription={subscriptionData}
        />
        <NativeNavigation myWorkspaceId={params.workspaceId} />
        <ScrollArea
          className="overflow-scroll
        relative
        h-[450px]"
        >
          <div
            className="pointer-events-none
          w-full
          absolute
          bottom-0
          h-24
          bg-gradient-to-t
          from-background
          to-transparent
          z-40"
          />
          <FoldersDropdownList
            workspaceFolders={workspaceFolderData || []}
            workspaceId={params.workspaceId}
          />
        </ScrollArea>
      </div>
      <div className="flex items-center justify-between w-full mt-4">
        <ModeToggle />
      </div>
    </aside>
  );
};

export default Sidebar;

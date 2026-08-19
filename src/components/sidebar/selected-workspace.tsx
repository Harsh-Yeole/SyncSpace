'use client';

import { createClientSupabaseClient } from "@/lib/supabase/create-client-supabase";
import { Workspace } from "@/lib/supabase/supabase.types";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface SelectedWorkspaceProps {
  workspace: Workspace;
  onClick?: (option: Workspace) => void;
}

const SelectedWorkspace: React.FC<SelectedWorkspaceProps> = ({
  workspace,
  onClick,
}) => {
  const supabase = createClientSupabaseClient();
  const [workspaceLogo, setWorkspaceLogo] = useState("/syncspacelogo.svg");
  useEffect(() => {
    if (workspace.logo) {
      const path = supabase.storage
        .from("workspace-logos")
        .getPublicUrl(workspace.logo)?.data.publicUrl;
      setWorkspaceLogo(path);
    }
  }, [workspace, supabase]);
  return (
    <Link
      href={`/dashboard/${workspace.id}`}
      onClick={() => {
        if (onClick) onClick(workspace);
      }}
      className="
      flex
      px-2
      rounded-md
      hover:bg-muted
      transition-all
      flex-row
      p-2
      gap-4
      justify-cneter
      items-center
      cursor-pointer
      my-2
      "
    >
      <Image src={workspaceLogo} alt="workspace-logo" height={26} width={26} />
      <div className="flex flex-col">
        <p
          className="text-lg
        w-[170px]
        overflow-hidden
        overflow-ellipsis
        whitespace-nowrap"
        >
          {workspace.title}
        </p>
      </div>
    </Link>
  );
};

export default SelectedWorkspace;

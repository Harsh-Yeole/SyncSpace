export const dynamic = "force-dynamic";

import QuillEditor from "@/components/quill-editor/quill-editor";
import { getWorkspaceDetails } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import React from "react";

type workspaceParams = Promise<{ workspaceId: string }>;

const WorkspacePage = async ({ params }: { params: workspaceParams }) => {
  const { workspaceId } = await params;
  const { data, error } = await getWorkspaceDetails(workspaceId);
  if (error || !data.length) redirect("/dashboard");

  return (
    <div className="relative flex-1 h-full flex flex-col">
      <QuillEditor
        dirType="workspace"
        fileId={workspaceId}
        dirDetails={data[0] || {}}
      />
    </div>
  );
};

export default WorkspacePage;

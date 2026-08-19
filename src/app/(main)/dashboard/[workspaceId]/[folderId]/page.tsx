export const dynamic = "force-dynamic";

import QuillEditor from "@/components/quill-editor/quill-editor";
import { getFolderDetails } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import React from "react";

type FolderParams = Promise<{
  folderId: string;
}>;

const FolderPage = async ({ params }: { params: FolderParams }) => {
  const { folderId } = await params;
  const { data, error } = await getFolderDetails(folderId);
  if (error || !data.length) redirect("/dashboard");

  return (
    <div className="relative flex-1 h-full flex flex-col">
      <QuillEditor
        dirType="folder"
        fileId={folderId}
        dirDetails={data[0] || {}}
      />
    </div>
  );
};

export default FolderPage;

export const dynamic = "force-dynamic";

import QuillEditor from "@/components/quill-editor/quill-editor";
import { getFileDetails } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import React from "react";

type FilePageProps = Promise<{
  fileId: string;
}>;

const FilePage = async ({ params }: { params: FilePageProps }) => {
  const { fileId } = await params;
  const { data, error } = await getFileDetails(fileId);
  if (error || !data.length) {
    console.log(`error in file page: ${error}`);
    redirect("/dashboard");
  }

  return (
    <div className="relative flex-1 h-full flex flex-col">
      <QuillEditor dirType="file" fileId={fileId} dirDetails={data[0] || {}} />
    </div>
  );
};

export default FilePage;

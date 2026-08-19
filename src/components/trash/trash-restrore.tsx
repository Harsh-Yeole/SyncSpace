'use client';
import { appFoldersType, useAppState } from "@/lib/providers/state-provider";
import { File as SupabaseFile } from "@/lib/supabase/supabase.types";
import { FileIcon, FolderIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Separator } from "../ui/separator";

const TrashRestore = () => {
  const { state, workspaceId, dispatch } = useAppState();
  const [folders, setFolders] = useState<appFoldersType[] | []>([]);
  const [files, setFiles] = useState<SupabaseFile[] | []>([]);

  useEffect(() => {
    const stateFolders =
      state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.filter((folder) => folder.inTrash) || [];
    setFolders(stateFolders);

    const stateFiles =
      state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.flatMap((folder) =>
          folder.files.filter((file) => file.inTrash)
        ) || [];
    console.log("Files in Trash:", stateFiles);
    setFiles(stateFiles);
  }, [state, workspaceId, dispatch]);
  return (
    <section>
      {!!folders.length && (
        <>
          <h3>Folders</h3>
          {folders.map((folder) => (
            <Link
              key={folder.id}
              href={`/dashboard/${workspaceId}/${folder.id}`}
              className="hover:bg-muted
                rounded-md
                p-2
                flex
                items-center
                justify-start"
            >
              <article>
                <aside className="flex items-center gap-2">
                  <FolderIcon />
                  {folder.title}
                </aside>
              </article>
            </Link>
          ))}
        </>
      )}
      {!!files.length && !!folders.length && (
        <>
          <br />
          <Separator />
          <br />
        </>
      )}
      {!!files.length && (
        <>
          <h3>Files</h3>
          {files.map((file) => (
            <Link
              key={file.id}
              href={`/dashboard/${workspaceId}/${file.folderId}/${file.id}`}
              className="hover:bg-muted
                rounded-md
                p-2
                flex
                items-center
                justify-start"
            >
              <article>
                <aside className="flex items-center gap-2">
                  <FileIcon />
                  {file.title}
                </aside>
              </article>
            </Link>
          ))}
        </>
      )}
      {!files.length && !folders.length && (
        <div
          className="text-muted-foreground
            absolute
            top-[50%]
            left-[50%]
            transform
            -translate-x-1/2
            -translate-y-1/2"
        >
          No items in trash
        </div>
      )}
    </section>
  );
};

export default TrashRestore;

'use client';
import { useAppState } from "@/lib/providers/state-provider";
import { Folder } from "@/lib/supabase/supabase.types";
import React, { useEffect, useState } from "react";
import TooltipComponent from "../global/tool-tip";
import { PlusIcon } from "lucide-react";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { v4 } from "uuid";
import { createFolder } from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";
import { Accordion } from "@/components/ui/accordion";
import DropDown from "./dropdown";
import { useSubscriptionModal } from "@/lib/providers/subscription-modal-provider";

interface FoldersDropdownListProps {
  workspaceFolders: Folder[];
  workspaceId: string;
}

const FoldersDropdownList: React.FC<FoldersDropdownListProps> = ({
  workspaceFolders,
  workspaceId,
}) => {
  const { setOpen } = useSubscriptionModal();
  const { subscription } = useSupabaseUser();
  const { toast } = useToast();
  //local state folders
  const { state, dispatch, folderId } = useAppState();
  const [folders, setFolders] = useState(workspaceFolders);
  const [addingFolder, setAddingFolder] = useState(false);

  //effect set initial state server app state
  useEffect(() => {
    if (workspaceFolders.length > 0) {
      dispatch({
        type: "SET_FOLDERS",
        payload: {
          workspaceId,
          folders: workspaceFolders.map((folder) => ({
            ...folder,
            files:
              state.workspaces
                .find((workspace) => workspace.id === workspaceId)
                ?.folders.find((f) => f.id === folder.id)?.files || [],
          })),
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceFolders, workspaceId]);

  //state
  useEffect(() => {
    // setFolders(
    //   state.workspaces.find((workspace) => workspace.id === workspaceId)
    //     ?.folders || []
    // );
    const workspaceFolders =
      state.workspaces.find((workspace) => workspace.id === workspaceId)
        ?.folders || [];

    // Prevent unnecessary state updates
    setFolders((prevFolders) => {
      if (JSON.stringify(prevFolders) !== JSON.stringify(workspaceFolders)) {
        return workspaceFolders;
      }
      return prevFolders;
    });
  }, [workspaceId, state.workspaces]);

  //add folder
  const addFolderHandler = async () => {
    setAddingFolder(true);
    // check for suscpription status
    if (!subscription && folders.length === 3) {
      setOpen(true);
      return;
    }
    //add folder
    const newFolder: Folder = {
      data: null,
      id: v4(),
      createdAt: new Date().toISOString(),
      title: "Untitled",
      iconId: "📄",
      inTrash: null,
      workspaceId: workspaceId,
      bannerUrl: "",
    };
    dispatch({
      type: "ADD_FOLDER",
      payload: {
        workspaceId,
        folder: { ...newFolder, files: [] },
      },
    });

    const { error } = await createFolder(newFolder);
    if (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: "Failed to create folder",
      });
    } else {
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
    }
    setAddingFolder(false);
  };
  return (
    <>
      <div
        className="flex
            sticky
            z-20
            top-0
            bg-background
            w-full
            h-10
            group/title
            justify-between
            items-center
            text-Neutrals/neutrals-8"
      >
        <span
          className="text-Neutrals/neutrals-8
                font-bold
                text-xs
                "
        >
          FOLDERS
        </span>
        <TooltipComponent message="Create Folder">
          <PlusIcon
            onClick={addingFolder=== true ? () => {} : addFolderHandler}
            size={16}
            className="group-hover/title:inline-block
            hidden
            cursor-pointer
            hover:text-foreground"
          />
        </TooltipComponent>
      </div>
      <Accordion
        type="multiple"
        defaultValue={[folderId || ""]}
        className="pb-20"
      >
        {folders
          .filter((folder) => !folder.inTrash)
          .map((folder, index) => (
            <DropDown
              key={index}
              title={folder.title}
              listType="folder"
              id={folder.id}
              iconId={folder.iconId}
            />
          ))}
      </Accordion>
    </>
  );
};

export default FoldersDropdownList;

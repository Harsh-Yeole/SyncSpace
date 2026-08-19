'use client';
import { useAppState } from "@/lib/providers/state-provider";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import clsx from "clsx";
import { createFile, updateFile, updateFolder } from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";
import EmojiPicker from "../global/emoji-picker";
import TooltipComponent from "../global/tool-tip";
import { PlusIcon, Trash } from "lucide-react";
import { File } from "@/lib/supabase/supabase.types";
import { v4 } from "uuid";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";

interface DropDownProps {
  title: string;
  id: string;
  listType: "folder" | "file";
  iconId: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

const DropDown: React.FC<DropDownProps> = ({
  title,
  id,
  listType,
  iconId,
  // children,
  // disabled,
  // ...props
}) => {
  // const supabase = createClientSupabaseClient();
  const { user } = useSupabaseUser();
  const { state, dispatch, workspaceId, folderId } = useAppState();
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  //folder title synced with server data and local one
  const folderTitle: string | undefined = useMemo(() => {
    const stateTitle = state.workspaces
      .find((w) => w.id === workspaceId)
      ?.folders.find((f) => f.id === id)?.title;

    if (title === stateTitle || !stateTitle) return title;
    return stateTitle;
  }, [state, workspaceId, id, title]);

  //file title
  const fileTitle: string | undefined = useMemo(() => {
    const fileAndFolderId = id.split("folder");
    const stateTitle = state.workspaces
      .find((w) => w.id === workspaceId)
      ?.folders.find((folder) => folder.id === fileAndFolderId[0])
      ?.files.find((file) => file.id === fileAndFolderId[1])?.title;

    if (title === stateTitle || !stateTitle) return title;
    return stateTitle;
  }, [state, workspaceId, id, title]);
  //function to navigate user to diff page
  const navigatePage = (accordianId: string, type: string) => {
    if (type === "folder") {
      router.push(`/dashboard/${workspaceId}/${accordianId}`);
    } else {
      router.push(
        `/dashboard/${workspaceId}/${folderId}/${
          accordianId.split("folder")[1]
        }`
      );
    }
  };

  // a double click handler to change values
  const handleDoubleClick = () => {
    setIsEditing(true);
  };
  //blur
  const handleBlur = async () => {
    if (!isEditing) return;
    setIsEditing(false);
    const fileAndFolderId = id.split("folder");

    if (fileAndFolderId.length === 1) {
      if (!folderTitle) return;
      const { error } = await updateFolder(
        { title: folderTitle },
        fileAndFolderId[0]
      );
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Failed to update folder title",
        });
      } else {
        toast({
          title: "Success",
          description: "Folder title changed.",
        });
      }
    } else if (fileAndFolderId.length === 2 && fileAndFolderId[1]) {
      if (!fileTitle) return;
      const { error } = await updateFile(
        { title: fileTitle },
        fileAndFolderId[1]
      );

      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Failed to update file title",
        });
      } else {
        toast({
          title: "Success",
          description: "File title changed.",
        });
      }
    }
  };

  //onChnages
  const onChangeEmoji = async (selectedEmoji: string) => {
    if (!workspaceId) return;
    const fileAndFolderId = id.split("folder");
    if (listType === "folder") {
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          workspaceId,
          folderId: id,
          folder: { iconId: selectedEmoji },
        },
      });

      const { error } = await updateFolder({ iconId: selectedEmoji }, id);

      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Failed to update emoji",
        });
      } else {
        toast({
          title: "Success",
          variant: "default",
          description: "Emoji updated successfully",
        });
      }
    } else if (listType === "file") {
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          workspaceId,
          folderId: fileAndFolderId[0],
          fileId: fileAndFolderId[1],
          file: { iconId: selectedEmoji },
        },
      });
      const { error } = await updateFile(
        { iconId: selectedEmoji },
        fileAndFolderId[1]
      );

      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Failed to update emoji",
        });
      } else {
        toast({
          title: "Success",
          variant: "default",
          description: "Emoji updated successfully",
        });
      }
    }
  };

  const folderTitleChange = (e: any) => {
    if (!workspaceId) return;
    const fileAndFolderId = id.split("folder");

    if (fileAndFolderId.length === 1) {
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          workspaceId,
          folderId: fileAndFolderId[0],
          folder: { title: e.target.value },
        },
      });
    }
  };

  const fileTitleChange = (e: any) => {
    if (!workspaceId) return;
    const fileAndFolderId = id.split("folder");

    if (fileAndFolderId.length === 2 && fileAndFolderId[1]) {
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          workspaceId,
          folderId: fileAndFolderId[0],
          fileId: fileAndFolderId[1],
          file: { title: e.target.value },
        },
      });
    }
  };

  //a way to add a file
  const addNewFile = async () => {
    if (!workspaceId) return;

    const newFile: File = {
      folderId: id,
      data: null,
      createdAt: new Date().toISOString(),
      inTrash: null,
      title: "Untitled",
      iconId: "📄",
      id: v4(),
      workspaceId,
      bannerUrl: "",
    };

    dispatch({
      type: "ADD_FILE",
      payload: { file: newFile, workspaceId, folderId: id },
    });

    const { error } = await createFile(newFile);
    if (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: "Failed to create file",
      });
    } else {
      toast({
        title: "Success",
        description: "File created successfully",
      });
    }
  };

  //move to trash method
  const moveToTrash = async () => {
    if (!user || !workspaceId) return;
    const fileAndFolderId = id.split("folder");
    if (listType === "folder") {
      const { error } = await updateFolder(
        { inTrash: `Deleted by ${user?.email}` },
        fileAndFolderId[0]
      );
      //update locally
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          folder: { inTrash: `Deleted by ${user?.email}` },
          folderId: fileAndFolderId[0],
          workspaceId,
        },
      });
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Failed to delete folder",
        });
      } else {
        toast({
          title: "Success",
          description: "Folder moved to trash",
        });
      }
    } else if (listType === "file") {
      const { error } = await updateFile(
        { inTrash: `Deleted by ${user?.email}` },
        fileAndFolderId[1]
      );
      //update locally
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          file: { inTrash: `Deleted by ${user?.email}` },
          folderId: fileAndFolderId[0],
          fileId: fileAndFolderId[1],
          workspaceId,
        },
      });
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Failed to delete file",
        });
      } else {
        toast({
          title: "Success",
          description: "File moved to trash",
        });
      }
    }
  };

  //styling
  const isFolder = listType === "folder";
  const listStyle = useMemo(
    () =>
      clsx("relative", {
        "border-none text-md": isFolder,
        "border-none ml-6 text-[16px] py-1": !isFolder,
      }),
    [isFolder]
  );
  const groupIdentifies = useMemo(
    () =>
      clsx(
        "text-foreground whitespace-nowrap flex justify-between items-center w-full relative",
        {
          "group/folder": isFolder,
          "group/file": !isFolder,
        }
      ),
    [isFolder]
  );

  const hoverStyles = useMemo(
    () =>
      clsx(
        "h-full hidden rounded-sm absolute right-0 items-center justify-center ",
        {
          "group-hover/file:block ": listType === "file",
          "group-hover/folder:block": listType === "folder",
        }
      ),
    [listType]
  );

  return (
    <AccordionItem
      value={id}
      className={listStyle}
      onClick={(e) => {
        e.stopPropagation();
        navigatePage(id, listType);
      }}
    >
      <AccordionTrigger
        id={listType}
        className="hover:no-underline
        p-2
        text-muted-foreground
        text-sm"
        disabled={listType === "file"}
      >
        <div className={groupIdentifies}>
          <div
            className="flex
            gap-4
            items-center
            justify-center
            overflow-hidden"
          >
            <div className="relative">
              <EmojiPicker getValue={onChangeEmoji}>{iconId}</EmojiPicker>
            </div>
            <input
              type="text"
              value={listType === "folder" ? folderTitle : fileTitle}
              className={clsx(
                "outline-none overflow-hidden w-[140px] text-Neutrals/neutrals-7",
                {
                  "bg-muted cursor-text": isEditing,
                  "bg-transparent cursor-pointer": !isEditing,
                }
              )}
              readOnly={!isEditing}
              onDoubleClick={handleDoubleClick}
              onBlur={handleBlur}
              onChange={
                listType === "folder" ? folderTitleChange : fileTitleChange
              }
            />
          </div>
          <div className={clsx("mt-1", hoverStyles)}>
            <TooltipComponent message="Delete Folder">
              <Trash
                onClick={moveToTrash}
                size={15}
                className="hover:text-foreground text-muted-foreground transition-colors"
              />
            </TooltipComponent>
            {listType === "folder" && !isEditing && (
              <TooltipComponent message="Add File">
                <PlusIcon
                  onClick={addNewFile}
                  size={15}
                  className="hover:text-foreground text-muted-foreground transition-colors"
                />
              </TooltipComponent>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {state.workspaces
          .find((workspace) => workspace.id === workspaceId)
          ?.folders.find((folder) => folder.id === id)
          ?.files.filter((file) => !file.inTrash)
          .map((file) => {
            const customFileId = `${id}folder${file.id}`;
            return (
              <DropDown
                key={file.id}
                title={file.title}
                listType="file"
                id={customFileId}
                iconId={file.iconId}
              />
            );
          })}
      </AccordionContent>
    </AccordionItem>
  );
};

export default DropDown;

'use client';
import { useAppState } from "@/lib/providers/state-provider";
import { File, Folder, Workspace } from "@/lib/supabase/supabase.types";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "quill/dist/quill.snow.css";
import { Button } from "../ui/button";
import {
  deleteFile,
  deleteFolder,
  findUser,
  getFileDetails,
  getFolderDetails,
  getWorkspaceDetails,
  updateFile,
  updateFolder,
  updateWorkspace,
} from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";
import { redirect, usePathname, useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import Image from "next/image";
import { createClientSupabaseClient } from "@/lib/supabase/create-client-supabase";
import EmojiPicker from "../global/emoji-picker";
import BannerUpload from "../banner-upload/banner-upload";
import { XCircleIcon } from "lucide-react";
import { useSocket } from "@/lib/providers/socket-provider";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { AiAssistant } from "./ai-assistant";
import { VoiceChat } from "./voice-chat";
import { TimeTravelPanel } from "./time-travel-slider";
import { History } from "lucide-react";
import { getColorForAuthor } from "@/lib/utils";

interface QuillEditorProps {
  dirType: "workspace" | "folder" | "file";
  fileId: string;
  dirDetails: Workspace | Folder | File;
}

const TOOLBAR_OPTIONS = [
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote", "code-block"],

  [{ header: 1 }, { header: 2 }], // custom button values
  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }], // superscript/subscript
  [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
  [{ direction: "rtl" }], // text direction

  [{ size: ["small", false, "large", "huge"] }], // custom dropdown
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  [{ font: [] }],
  [{ align: [] }],

  ["clean"], // remove formatting button
];

const QuillEditor: React.FC<QuillEditorProps> = ({
  dirType,
  fileId,
  dirDetails,
}) => {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const pathName = usePathname();
  const saveTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useSupabaseUser();
  const { socket } = useSocket();
  const { toast } = useToast();
  const {
    state,
    dispatch,
    workspaceId,
    folderId,
  } = useAppState();
  const [quill, setQuill] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<
    { id: string; email: string; avatarUrl: string }[]
  >([]);
  const [timestampedBannerUrl, setTimestampedBannerUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState(false);
  const [localCursors, setLocalCursors] = useState<any[]>([]);
  const [isTimeTravelOpen, setIsTimeTravelOpen] = useState(false);
  const [isAiWriting, setIsAiWriting] = useState(false);

  const wrapperRef = useCallback((wrapper: HTMLDivElement | null) => {
    if (typeof window !== "undefined") {
      if (wrapper === null) return;
      wrapper.innerHTML = "";
      const editor = document.createElement("div");
      wrapper.append(editor);
      (async () => {
        const Quill = (await import("quill")).default;
        const QuillCursors = (await import("quill-cursors")).default;
        Quill.register("modules/cursors", QuillCursors);
        
        // Register custom author blot
        const Inline = Quill.import("blots/inline") as any;
        class AuthorBlot extends Inline {
          static create(value: string) {
            const node = super.create() as HTMLElement;
            node.setAttribute("data-author", value);
            node.style.setProperty("--author-bg", getColorForAuthor(value));
            node.style.backgroundColor = "var(--author-bg)";
            node.style.borderRadius = "2px";
            node.style.padding = "0 2px";
            return node;
          }
          static formats(node: HTMLElement) {
            return node.getAttribute("data-author");
          }
          format(name: string, value: any) {
            if (name === "author" && value) {
              this.domNode.setAttribute("data-author", value);
              this.domNode.style.setProperty("--author-bg", getColorForAuthor(value));
              this.domNode.style.backgroundColor = "var(--author-bg)";
            } else {
              super.format(name, value);
            }
          }
        }
        (AuthorBlot as any).blotName = "author";
        (AuthorBlot as any).tagName = "span";
        Quill.register(AuthorBlot);

        const q = new Quill(editor, {
          theme: "snow",
          modules: {
            toolbar: TOOLBAR_OPTIONS,
            cursors: {
              transformOnTextChange: true,
            },
          },
        });
        setQuill(q);
      })();
    }
  }, []);

  const details = useMemo(() => {
    let selectedDir;
    if (dirType === "file") {
      selectedDir = state.workspaces
        .find((w) => w.id === workspaceId)
        ?.folders.find((f) => f.id === folderId)
        ?.files.find((f) => f.id === fileId);
    } else if (dirType === "folder") {
      selectedDir = state.workspaces
        .find((w) => w.id === workspaceId)
        ?.folders.find((f) => f.id === fileId);
    } else if (dirType === "workspace") {
      selectedDir = state.workspaces.find((w) => w.id === fileId);
    }

    if (selectedDir) return selectedDir;
    return {
      title: dirDetails.title,
      iconId: dirDetails.iconId,
      createdAt: dirDetails.createdAt,
      data: dirDetails.data,
      inTrash: dirDetails.inTrash,
      bannerUrl: dirDetails.bannerUrl,
    } as Workspace | Folder | File;
  }, [state, workspaceId, folderId, fileId, dirDetails, dirType]);

  //know where you are
  const breadCrumbs = useMemo(() => {
    if (!pathName || !workspaceId || !state.workspaces) return;

    //workspace breadcrumb
    const segments = pathName.split("/").filter((s) => s !== "dashboard" && s);
    const workspaceDetails = state.workspaces.find((w) => w.id === workspaceId);
    const workspaceBreadCrumb = workspaceDetails
      ? `${workspaceDetails.iconId} ${workspaceDetails.title}`
      : "";
    if (segments.length === 1) return [workspaceBreadCrumb];

    //folder breadcrumb
    const folderSegmentId = segments[1];
    const folderDetails = workspaceDetails?.folders.find(
      (f) => f.id === folderSegmentId
    );
    const folderBreadCrumbs = folderDetails
      ? `/ ${folderDetails.iconId} ${folderDetails.title}`
      : "";
    if (segments.length === 2)
      return `${workspaceBreadCrumb} ${folderBreadCrumbs}`;

    //file breadcrumb
    const fileSegmentId = segments[2];
    const fileDetails = folderDetails?.files.find(
      (f) => f.id === fileSegmentId
    );
    const fileBreadCrumbs = fileDetails
      ? `/ ${fileDetails.iconId} ${fileDetails.title}`
      : "";
    return `${workspaceBreadCrumb} ${folderBreadCrumbs} ${fileBreadCrumbs}`;
  }, [state, workspaceId, pathName]);

  // restore file
  const restoreFileHandler = async () => {
    if (dirType === "file") {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          workspaceId,
          fileId,
          folderId,
          file: { inTrash: "" },
        },
      });
      await updateFile({ inTrash: "" }, fileId);
      toast({
        title: "Restored",
        description: "File has been restored",
      });
    } else if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          workspaceId,
          folderId: fileId,
          folder: { inTrash: "" },
        },
      });
      await updateFolder({ inTrash: "" }, fileId);
      toast({
        title: "Restored",
        description: "Folder has been restored",
      });
    }
  };

  // delete file
  const deleteFileHandler = async () => {
    if (dirType === "file") {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: "DELETE_FILE",
        payload: {
          workspaceId,
          fileId,
          folderId,
        },
      });
      await deleteFile(fileId);
      toast({
        title: "Deleted",
        description: "File has been deleted",
      });
      //   router.replace(`/dashboard/${workspaceId}/${folderId}`);
      redirect(`/dashboard/${workspaceId}/${folderId}`);
    } else if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({
        type: "DELETE_FOLDER",
        payload: {
          workspaceId,
          folderId: fileId,
        },
      });
      await deleteFolder(fileId);
      toast({
        title: "Deleted",
        description: "Folder has been deleted",
      });
      redirect(`/dashboard/${workspaceId}`);
    }
  };

  // delete banner
  const deleteBanner = async () => {
    if (!fileId) return;
    setDeletingBanner(true);
    if (dirType === "file") {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: "UPDATE_FILE",
        payload: { file: { bannerUrl: "" }, fileId, folderId, workspaceId },
      });
      await supabase.storage.from("file-banners").remove([`banner-${fileId}`]);
      await updateFile({ bannerUrl: "" }, fileId);
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({
        type: "UPDATE_FOLDER",
        payload: { folder: { bannerUrl: "" }, folderId: fileId, workspaceId },
      });
      await supabase.storage.from("file-banners").remove([`banner-${fileId}`]);
      await updateFolder({ bannerUrl: "" }, fileId);
    }
    if (dirType === "workspace") {
      dispatch({
        type: "UPDATE_WORKSPACE",
        payload: {
          workspace: { bannerUrl: "" },
          workspaceId: fileId,
        },
      });
      await supabase.storage.from("file-banners").remove([`banner-${fileId}`]);
      await updateWorkspace({ bannerUrl: "" }, fileId);
    }
    if (socket) {
      socket.emit("send-dir-update", dirType, fileId, { bannerUrl: "" });
    }
    setDeletingBanner(false);
  };

  //change icon
  const iconOnChange = async (icon: string) => {
    setSaving(true);
    if (!fileId) return;
    if (dirType === "workspace") {
      dispatch({
        type: "UPDATE_WORKSPACE",
        payload: { workspace: { iconId: icon }, workspaceId: fileId },
      });
      await updateWorkspace({ iconId: icon }, fileId);
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          folder: { iconId: icon },
          workspaceId: workspaceId,
          folderId: fileId,
        },
      });
      await updateFolder({ iconId: icon }, fileId);
    }
    if (dirType === "file") {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          file: { iconId: icon },
          workspaceId: workspaceId,
          fileId: fileId,
          folderId: folderId,
        },
      });
      await updateFile({ iconId: icon }, fileId);
    }
    if (socket) {
      socket.emit("send-dir-update", dirType, fileId, { iconId: icon });
    }
    setSaving(false);
  };

  // getting dynamic image
  useEffect(() => {
    if (socket === null) return;
    const socketHandler = (
      dirTypeUpdate: string,
      fileIdUpdate: string,
      payload: any
    ) => {
      if (dirTypeUpdate === "workspace") {
        dispatch({
          type: "UPDATE_WORKSPACE",
          payload: { workspace: payload, workspaceId: fileIdUpdate },
        });
      } else if (dirTypeUpdate === "folder" && workspaceId) {
        dispatch({
          type: "UPDATE_FOLDER",
          payload: { folder: payload, folderId: fileIdUpdate, workspaceId },
        });
      } else if (dirTypeUpdate === "file" && workspaceId && folderId) {
        dispatch({
          type: "UPDATE_FILE",
          payload: { file: payload, fileId: fileIdUpdate, folderId, workspaceId },
        });
      }
    };
    socket.on("receive-dir-update", socketHandler);
    return () => {
      socket.off("receive-dir-update", socketHandler);
    };
  }, [socket, dispatch, workspaceId, folderId]);

  // title updating
  useEffect(() => {
    if (details.bannerUrl) {
      const publicUrl = supabase.storage
        .from("file-banners")
        .getPublicUrl(details.bannerUrl).data.publicUrl;
      setTimestampedBannerUrl(`${publicUrl}?t=${new Date().getTime()}`);
    }
  }, [state, details.bannerUrl, supabase]);

  // on change handler (so tht everything that has changed using
  // socket can be updated in local changes and also sent
  // all the events/update to other client )
  useEffect(() => {
    if (!fileId) return;
    const fetchInformation = async () => {
     
      if (dirType === "file") {
        const { data: selectedDir, error } = await getFileDetails(fileId);
        if (error || !selectedDir) {
          return router.replace("/dashboard");
        }

        if (!selectedDir[0]) {
          if (!workspaceId) return;
          return router.replace(`/dashboard/${workspaceId}`);
        }
        if (!workspaceId || quill === null) return;
        if (!selectedDir[0].data) return;
        quill.setContents(JSON.parse(selectedDir[0].data || ""));
        dispatch({
          type: "UPDATE_FILE",
          payload: {
            file: { data: selectedDir[0].data },
            fileId,
            folderId: selectedDir[0].folderId,
            workspaceId,
          },
        });
      }
      if (dirType === "folder") {
        const { data: selectedDir, error } = await getFolderDetails(fileId);
        if (error || !selectedDir) {
          return router.replace("/dashboard");
        }

        if (!selectedDir[0]) {
          router.replace(`/dashboard/${workspaceId}`);
        }
        if (quill === null) return;
        if (!selectedDir[0].data) return;
        quill.setContents(JSON.parse(selectedDir[0].data || ""));
        dispatch({
          type: "UPDATE_FOLDER",
          payload: {
            folderId: fileId,
            folder: { data: selectedDir[0].data },
            workspaceId: selectedDir[0].workspaceId,
          },
        });
      }
      if (dirType === "workspace") {
        const { data: selectedDir, error } = await getWorkspaceDetails(fileId);
        if (error || !selectedDir) {
          return router.replace("/dashboard");
        }
        if (!selectedDir[0] || quill === null) return;
        if (!selectedDir[0].data) return;
        quill.setContents(JSON.parse(selectedDir[0].data || ""));
        dispatch({
          type: "UPDATE_WORKSPACE",
          payload: {
            workspace: { data: selectedDir[0].data },
            workspaceId: fileId,
          },
        });
      }
    };
    fetchInformation();
  }, [fileId, workspaceId, quill, dirType, dispatch, router]);

  // room joining is handled inside the presence useEffect

  // send data to other clients
  useEffect(() => {
    if (quill === null || socket === null || !fileId || !user) return;
    const selectionChangeHandler = (cursorId: string) => {
      return (range: any, oldRange: any, source: any) => {
        if (source === "user" && cursorId) {
          socket.emit("send-cursor-move", range, fileId, cursorId);
        }
      };
    };
    const quillHandler = (delta: any, oldDelta: any, source: any) => {
      if (source !== "user") return;

      const authorName = user.email.split('@')[0];

      // Mutate the delta to include author formatting, and format the local quill editor
      let currentIndex = 0;
      delta.ops.forEach((op: any) => {
        if (op.retain) {
          currentIndex += op.retain;
        } else if (op.insert && typeof op.insert === "string") {
          // Mutate the delta so other users receive the author attribute
          if (!op.attributes) op.attributes = {};
          op.attributes.author = authorName;
          
          // Format the text locally without triggering a "user" text-change
          quill.formatText(currentIndex, op.insert.length, "author", authorName, "api");
          currentIndex += op.insert.length;
        }
      });

      // Debounced save block handles Time Travel snapshot
      if (saveTimeRef.current) clearTimeout(saveTimeRef.current);
      setSaving(true);
      const contents = quill.getContents();
      
      // Dedicated 5-second debounce for Time Travel snapshots
      if (historyTimeRef.current) clearTimeout(historyTimeRef.current);
      historyTimeRef.current = setTimeout(() => {
        if (contents && fileId && socket) {
          socket.emit("save-history", contents, fileId);
        }
      }, 5000);

      saveTimeRef.current = setTimeout(async () => {
        if (contents && fileId) {
          if (dirType == "workspace") {
            dispatch({
              type: "UPDATE_WORKSPACE",
              payload: {
                workspace: { data: JSON.stringify(contents) || "" },
                workspaceId: fileId,
              },
            });
            await updateWorkspace(
              { data: JSON.stringify(contents) || "" },
              fileId
            );
          }
          if (dirType == "folder") {
            if (!workspaceId) return;
            dispatch({
              type: "UPDATE_FOLDER",
              payload: {
                folder: { data: JSON.stringify(contents) || "" },
                workspaceId,
                folderId: fileId,
              },
            });
            await updateFolder(
              { data: JSON.stringify(contents) || "" },
              fileId
            );
          }
          if (dirType == "file") {
            if (!workspaceId || !folderId) return;
            dispatch({
              type: "UPDATE_FILE",
              payload: {
                file: { data: JSON.stringify(contents) || "" },
                workspaceId,
                folderId: folderId,
                fileId,
              },
            });
            await updateFile({ data: JSON.stringify(contents) || "" }, fileId);
          }
        }
        setSaving(false);
      }, 850);
      socket.emit("send-changes", delta, fileId);
    };
    quill.on("text-change", quillHandler);
    quill.on("selection-change", selectionChangeHandler(user.id));

    return () => {
      quill.off("text-change", quillHandler);
      quill.off("selection-change", selectionChangeHandler);
      if (saveTimeRef.current) clearTimeout(saveTimeRef.current);
    };
  }, [
    quill,
    socket,
    fileId,
    user,
    details,
    folderId,
    workspaceId,
    dispatch,
    dirType,
  ]);

  // receiving data from other clients and AI
  useEffect(() => {
    if (quill === null || socket === null) return;
    const socketHandler = (deltas: any, id: string) => {
      if (id === fileId) {
        // Clone ops to prevent mutation bugs from updateContents
        const ops = JSON.parse(JSON.stringify(deltas.ops || []));
        quill.updateContents(deltas);

        // Force format text to bypass quill-cursors interference
        let currentIndex = 0;
        ops.forEach((op: any) => {
          if (op.retain) {
            currentIndex += op.retain;
          } else if (op.insert && typeof op.insert === "string") {
            if (op.attributes && op.attributes.author) {
              try {
                quill.formatText(currentIndex, op.insert.length, "author", op.attributes.author, "api");
              } catch (e) {
                console.error("Failed to format AI text:", e);
              }
            }
            currentIndex += op.insert.length;
          }
        });
      }
    };
    
    const aiStartedHandler = () => {
      setIsAiWriting(true);
      quill.disable();
    };

    const aiFinishedHandler = () => {
      setIsAiWriting(false);
      quill.enable();
    };

    socket.on("receive-changes", socketHandler);
    socket.on("ai-started", aiStartedHandler);
    socket.on("ai-finished", aiFinishedHandler);
    
    return () => {
      socket.off("receive-changes", socketHandler);
      socket.off("ai-started", aiStartedHandler);
      socket.off("ai-finished", aiFinishedHandler);
    };
  }, [quill, socket, fileId]);

  //listen to cursor changes
  useEffect(() => {
    if (!quill || !socket || !fileId || !localCursors.length) return;
    const socketHandler = (range: any, roomId: string, cursorId: string) => {
      if (roomId === fileId) {
        const cursorToMove = localCursors.find(
          (c: any) => c.cursors()?.[0].id === cursorId
        );
        if (cursorToMove) cursorToMove.moveCursor(cursorId, range);
      }
    };
    socket.on("receive-cursor-move", socketHandler);
    return () => {
      socket.off("receive-cursor-move", socketHandler);
    };
  }, [quill, socket, fileId, localCursors]);

  //cursors and presence via socket.io
  useEffect(() => {
    if (!fileId || !quill || !socket || !user) return;

    const syncHandler = (collaboratorsList: any[]) => {
      // Keep all raw connections for WebRTC
      setCollaborators(collaboratorsList);

      // Filter out duplicate user entries for cursors
      const uniqueCollaborators = Array.from(
        new Map(collaboratorsList.map(c => [c.id, c])).values()
      );
      
      const allCursors: any = [];
      uniqueCollaborators.forEach(
        (collaborator: any) => {
          if (collaborator.id !== user.id) {
            const userCursor = quill.getModule("cursors");
            userCursor.createCursor(
              collaborator.id,
              collaborator.email.split("@")[0],
              `#${Math.random().toString(16).slice(2, 8)}`
            );
            allCursors.push(userCursor);
          }
        }
      );
      setLocalCursors(allCursors);
    };

    socket.on("presence-sync", syncHandler);

    const sendPresence = async () => {
      const response = await findUser(user.id);
      if (!response) return;

      const avatarUrl = response.avatarUrl
        ? supabase.storage.from("avatars").getPublicUrl(response.avatarUrl).data.publicUrl
        : "";

      socket.emit("join-room", fileId, {
        id: user.id,
        email: user.email,
        avatarUrl,
      });
    };

    sendPresence();

    return () => {
      socket.off("presence-sync", syncHandler);
    };
  }, [fileId, quill, socket, user, supabase]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="relative flex-shrink-0">
        {details.inTrash && (
          <article
            className="py-2
            z-40
            bg-[#EB5757]
            flex
            flex-col
            justify-center
            items-center
            gap-2
            flex-wrap
            "
          >
            <div
              className="flex
                flex-col
                md:flex-row
                gap-2
                justify-center
                items-center
                "
            >
              <span className="text-white">This {dirType} is in trash.</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={"outline"}
                  className="bg-transparent
                border-white
                text-white
                hover:bg-white
                hover:text-green-500
                "
                  onClick={restoreFileHandler}
                >
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant={"outline"}
                  className="bg-transparent
                border-white
                text-white
                hover:bg-white
                hover:text-[#EB5757]
                "
                  onClick={deleteFileHandler}
                >
                  Delete
                </Button>
              </div>
            </div>
            <span className="text-sm text-white">{details.inTrash}</span>
          </article>
        )}
        <div
          className="flex
        flex-col-reverse
        sm:flex-row
        sm:justify-between
        justify-center
        sm:items-center
        py-4
        px-6
        border-b
        "
        >
          <div>{breadCrumbs}</div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="gap-2 h-9 rounded-full px-4" onClick={() => setIsTimeTravelOpen(!isTimeTravelOpen)}>
              <History size={16} />
              Time Travel
            </Button>
            <AiAssistant roomId={fileId} quill={quill} />
            <VoiceChat roomId={fileId} collaborators={collaborators} />
            <div className="flex items-center justify-center h-10">
              {Array.from(new Map(collaborators?.map(c => [c.id, c])).values()).map((collaborator) => (
                <TooltipProvider key={collaborator.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar
                        className="
                    -ml-3 
                    bg-background 
                    border-2 
                    flex 
                    items-center 
                    justify-center 
                    h-8 
                    w-8 
                    rounded-full
                    "
                        style={{
                          borderColor: getColorForAuthor(collaborator.email.split("@")[0]).replace("0.4", "1.0"),
                          borderWidth: "2px",
                          borderStyle: "solid"
                        }}
                      >
                        <AvatarImage
                          src={`${
                            supabase.storage
                              .from("avatars")
                              .getPublicUrl(`avatar.${collaborator.id}`).data
                              .publicUrl
                          }`}
                          // src={avatarUrl}
                          className="rounded-full"
                        />
                        <AvatarFallback>
                          {collaborator.email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getColorForAuthor(collaborator.email.split("@")[0]).replace("0.4", "1.0") }}
                      />
                      {collaborator.email.split("@")[0]} {collaborator.id === user?.id ? "(You)" : ""}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            {saving ? (
              <Badge
                variant={"secondary"}
                className="bg-orange-600
                top-4
                text-white
                right-4
                h-7
                z-50"
              >
                Saving...
              </Badge>
            ) : (
              <Badge
                variant={"secondary"}
                className="bg-emerald-600
                top-4
                text-white
                right-4
                h-7
                z-50"
              >
                Saved
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex w-full flex-1 overflow-hidden">
        <div className="w-full flex-col flex flex-1 overflow-y-auto relative">
        {details.bannerUrl && timestampedBannerUrl !== "" && (
          <div className="relative w-full h-[230px]">
          <Image
            src={timestampedBannerUrl}
            alt="Banner Image"
            fill
            className="w-full
            md:h-48
            h-20
            object-cover"
          />
        </div>
      )}
      <div
        className="flex
        flex-col
        mt-2
        relative"
      >
        <div
          className="w-full
            max-w-5xl
            mx-auto
            flex
            flex-col
            px-7
            lg:my-8"
        >
          <div className="text-[80px] ">
            <EmojiPicker getValue={iconOnChange}>
              <div
                className="w-[100px]
                cursor-pointer
                transition-colors
                h-[100px]
                flex
                items-center
                justify-start
                hover:bg-muted
                rounded-xl"
              >
                {details.iconId}
              </div>
            </EmojiPicker>
          </div>
          <div className="flex">
            <BannerUpload
              dirDetails={details}
              fileId={fileId}
              dirType={dirType}
              className="mt-2
            text-sm
            text-muted-foreground
            p-2
            hover:text-card-foreground
            transition-all
            rounded-md
            "
            >
              {details.bannerUrl ? "Update Banner" : "Add Banner"}
            </BannerUpload>
            {details.bannerUrl && (
              <Button
                disabled={deletingBanner}
                onClick={deleteBanner}
                variant="ghost"
                className="gap-1 hover:bg-background
                flex
                item-center
                justify-center
                mt-2
                text-sm
                text-muted-foreground
                w-36
                p-2
                rounded-md"
              >
                <XCircleIcon size={16} />
                <span className="whitespace-nowrap font-normal">
                  Remove Banner
                </span>
              </Button>
            )}
          </div>
          <span
            className="text-muted-foreground
          text-3xl
          font-bold
          h-9"
          >
            {details.title}
          </span>
          <span
            className="text-muted-foreground text-sm
          "
          >
            {dirType.toUpperCase()}
          </span>
        </div>
          <div id="container" className="max-w-5xl w-full mx-auto px-4" ref={wrapperRef}></div>
          
          {/* AI Writing Spinner Overlay */}
          {isAiWriting && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur border border-indigo-500/30 shadow-lg px-6 py-3 rounded-full flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
              </div>
              <span className="text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                AI Co-Pilot is writing...
              </span>
            </div>
          )}
        </div>
        </div>
        {isTimeTravelOpen && (
          <TimeTravelPanel roomId={fileId} quill={quill} onClose={() => setIsTimeTravelOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default QuillEditor;

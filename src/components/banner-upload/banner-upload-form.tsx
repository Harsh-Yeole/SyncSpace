'use client';
import {
  appFoldersType,
  appWorkspacesType,
  useAppState,
} from "@/lib/providers/state-provider";
import { createClientSupabaseClient } from "@/lib/supabase/create-client-supabase";
import { File, Folder, Workspace } from "@/lib/supabase/supabase.types";
import { UploadBannerFormSchema } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Loader from "../global/loader";
import { useToast } from "@/hooks/use-toast";
import {
  updateFile,
  updateFolder,
  updateWorkspace,
} from "@/lib/supabase/queries";
import { useSocket } from "@/lib/providers/socket-provider";

interface BannerUploadProps {
  dirType: "workspace" | "folder" | "file";
  id: string;
  details: appWorkspacesType | appFoldersType | Workspace | Folder | File;
}

const BannerUploadForm: React.FC<BannerUploadProps> = ({ dirType, id }) => {
  const supabase = createClientSupabaseClient();
  const { workspaceId, folderId, dispatch } = useAppState();
  const { socket } = useSocket();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,

    formState: { isSubmitting: isUploading, errors },
  } = useForm<z.infer<typeof UploadBannerFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(UploadBannerFormSchema),
  });

  const submitHandler: SubmitHandler<
    z.infer<typeof UploadBannerFormSchema>
  > = async (value) => {
    const file = value.banner?.[0];
    if (!file || !id) return;
    try {
      let filePath = null;

      const deleteBanner = async () => {
        await supabase.storage.from("file-banners").remove([`banner-${id}`]);
      };
      const uploadBanner = async () => {
        const { data, error } = await supabase.storage
          .from("file-banners")
          .upload(`banner-${id}`, file);
        if (error) {
          throw new Error(error.message);
        }
        filePath = data.path;
      };
      console.log(`filepath: ${filePath}`);

      if (dirType == "file") {
        if (!workspaceId || !folderId) return;
        await deleteBanner();
        await uploadBanner();
        dispatch({
          type: "UPDATE_FILE",
          payload: {
            fileId: id,
            workspaceId,
            folderId,
            file: {
              bannerUrl: filePath,
            },
          },
        });
        await updateFile({ bannerUrl: filePath }, id);
      }
      if (dirType == "folder") {
        if (!workspaceId) return;
        await deleteBanner();
        await uploadBanner();
        dispatch({
          type: "UPDATE_FOLDER",
          payload: {
            folderId: id,
            workspaceId,
            folder: {
              bannerUrl: filePath,
            },
          },
        });
        await updateFolder({ bannerUrl: filePath }, id);
      }
      if (dirType == "workspace") {
        await deleteBanner();
        await uploadBanner();
        dispatch({
          type: "UPDATE_WORKSPACE",
          payload: {
            workspaceId: id,
            workspace: {
              bannerUrl: filePath,
            },
          },
        });
        await updateWorkspace({ bannerUrl: filePath }, id);
      }
      
      if (socket) {
        socket.emit("send-dir-update", dirType, id, { bannerUrl: filePath });
      }
    } catch (error) {
      console.log(`error in banner upload form: ${error}`);
      toast({
        title: "error",
        description: "Error uploading banner",
      });
    }
  };
  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="flex flex-col gap-2"
    >
      <Label htmlFor="bannerImage" className="text-sm text-muted-foreground">
        Banner Image
      </Label>
      <Input
        id="bannerImage"
        type="file"
        accept="image/*"
        className="text-muted-foreground"
        disabled={isUploading}
        {...register("banner", { required: "Banner Image is required" })}
      />
      <small className="text-red-600">
        {errors.banner?.message?.toString()}
      </small>
      <Button disabled={isUploading} type="submit">
        {!isUploading ? "Upload Banner" : <Loader />}
      </Button>
    </form>
  );
};

export default BannerUploadForm;

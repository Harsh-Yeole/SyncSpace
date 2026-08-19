import { File, Folder, Workspace } from "@/lib/supabase/supabase.types";
import React from "react";
import CustomDialogTrigger from "../global/custom-dialog";
import BannerUploadForm from "./banner-upload-form";
import {
  appFoldersType,
  appWorkspacesType,
} from "@/lib/providers/state-provider";

interface BannerUploadProps {
  children: React.ReactNode;
  className?: string;
  dirType: "workspace" | "folder" | "file";
  fileId: string;
  dirDetails: appWorkspacesType | appFoldersType | Workspace | Folder | File;
}

const BannerUpload: React.FC<BannerUploadProps> = ({
  children,
  className,
  dirType,
  fileId,
  dirDetails,
}) => {
  return (
    <CustomDialogTrigger
      header="Upload Banner"
      content={
        <BannerUploadForm details={dirDetails} 
        id={fileId} 
        dirType={dirType} />
      }
      className={className}
    >
      {children}
    </CustomDialogTrigger>
  );
};

export default BannerUpload;

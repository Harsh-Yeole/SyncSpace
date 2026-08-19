'use client';
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { User, Workspace } from "@/lib/supabase/supabase.types";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import { Lock, Plus, Share } from "lucide-react";
import { Button } from "../ui/button";
import { v4 } from "uuid";
import {
  addWorkspaceCollaborators,
  createWorkspace,
} from "@/lib/supabase/queries";
import CollaboratorsSearch from "./collaborators-search";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Loader from "./loader";
import { useToast } from "@/hooks/use-toast";

const WorkspaceCreator = () => {
  const { user } = useSupabaseUser();
  const {toast}= useToast();
  const router = useRouter();
  const [permission, setPermission] = useState("private");
  const [title, setTitle] = useState("");
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addCollaborators = (user: User) => {
    setCollaborators([...collaborators, user]);
  };

  const removeCollaborator = (user: User) => {
    setCollaborators(collaborators.filter((c) => c.id !== user.id));
  };

  const createItem = async () => {
    setIsLoading(true);
    const uuid = v4();
    if (user?.id) {
      const newWorkspace: Workspace = {
        data: null,
        createdAt: new Date().toISOString(),
        iconId: "💼",
        id: uuid,
        inTrash: "",
        title: title,
        workspaceOwner: user.id,
        logo: null,
        bannerUrl: "",
      };

      if (permission === "private") {
        await createWorkspace(newWorkspace);
        toast({title: 'Success', description: 'Workspace created successfully'})
        router.refresh();
      } else if (permission === "shared") {
        await createWorkspace(newWorkspace);
        await addWorkspaceCollaborators(collaborators, uuid);
        router.refresh();
      }
    }
    setIsLoading(false);
  };
  return (
    <div className="flex gap-4 flex-col">
      <div className="flex gap-1 flex-col">
        <Label htmlFor="name" className="text-sm text-muted-foreground">
          Name
        </Label>
        <div
          className="flex
        justify-center
        items-center
        gap-2"
        >
          <Input
            name="name"
            value={title}
            placeholder="Workspace Name"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      </div>
      <>
        <Label
          htmlFor="permissions"
          className="text-sm
        text-muted-foreground"
        >
          Permissions
        </Label>
        <Select
          onValueChange={(val) => setPermission(val)}
          defaultValue={permission}
        >
          <SelectTrigger className="w-full h-25 -mt-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="private">
                <div
                  className="p-2
                        flex
                        gap-4
                        justify-center
                        items-center"
                >
                  <Lock />
                  <article className="text-left flex flex-col">
                    <span>Private</span>
                    <p>
                      Your workspace is private to you. You can choose to share
                      it later.
                    </p>
                  </article>
                </div>
              </SelectItem>
              <SelectItem value="shared">
                <div
                  className="p-2
                        flex
                        gap-4
                        justify-center
                        items-center"
                >
                  <Share />
                  <article className="text-left flex flex-col">
                    <span>Shared</span>
                    <p>You can invite collaborators.</p>
                  </article>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </>
      {permission === "shared" && (
        <div>
          <CollaboratorsSearch
            existingCollaborators={collaborators}
            getCollaborator={(user) => addCollaborators(user)}
          >
            <Button type="button" className="text-sm mt-4">
              <Plus />
              Add Collaborators
            </Button>
          </CollaboratorsSearch>
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">
              Collaborators: {collaborators.length || "None"}
            </span>
            <ScrollArea
              className="h-[120px]
            w-full
            rounded-md
            border
            border-muted-foreground/20"
            >
              {collaborators.length ? (
                collaborators.map((c, index) => (
                  <div
                    className="p-4 flex
                    justify-center
                    items-center"
                    key={index}
                  >
                    <div className="flex gap-4 items-center">
                      <Avatar>
                        <AvatarImage src="/avatars/7.png" />
                        <AvatarFallback>DP</AvatarFallback>
                      </Avatar>
                      <div
                        className="text-sm
                        gap-2
                        text-muted-foreground
                        overflow-hidden
                        overflow-ellipsis
                        sm:w-[280px]
                        w-[140px]"
                      >
                        {c.email}
                      </div>
                    </div>
                    <Button
                      variant={"secondary"}
                      onClick={() => removeCollaborator(c)}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              ) : (
                <div
                  className="
                    absolute
                    right-0 left-0 top-0 bottom-0
                    flex
                    justify-center items-center"
                >
                  <span className="text-muted-foreground text-sm">
                    You have no collaborators yet.
                  </span>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
      <Button
        type="button"
        disabled={
          !title ||
          (permission === "shared" && collaborators.length === 0) ||
          isLoading
        }
        variant={"secondary"}
        onClick={() => createItem()}
      >
        {isLoading ? <Loader /> : "Create"}
      </Button>
    </div>
  );
};

export default WorkspaceCreator;

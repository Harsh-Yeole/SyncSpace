'use client';
import { useAppState } from "@/lib/providers/state-provider";
import { Workspace } from "@/lib/supabase/supabase.types";
import React, { useEffect, useState } from "react";
import SelectedWorkspace from "./selected-workspace";
import CustomDialogTrigger from "../global/custom-dialog";
import WorkspaceCreator from "../global/workspace-creator";
import { Plus } from "lucide-react";

interface WorkspaceDropdownProps {
  privateWorkspace: Workspace[] | [];
  sharedWorkspace: Workspace[] | [];
  collaboratingWorkspace: Workspace[] | [];
  defaltValue: Workspace | undefined;
}

const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({
  privateWorkspace,
  sharedWorkspace,
  collaboratingWorkspace,
  defaltValue,
}) => {
  const { dispatch, state } = useAppState();
  const [selectedOption, setSelectedOption] = useState(defaltValue);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: Workspace) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!state.workspaces.length) {
      dispatch({
        type: "SET_WORKSPACES",
        payload: {
          workspaces: [
            ...privateWorkspace,
            ...sharedWorkspace,
            ...collaboratingWorkspace,
          ].map((workspace) => ({ ...workspace, folders: [] })),
        },
      });
    }
  }, [
    privateWorkspace,
    sharedWorkspace,
    collaboratingWorkspace,
    dispatch,
    state.workspaces.length,
  ]);

  // in real time update the selected workspace name when editing the name in settings
  useEffect(() => {
    const findSelectedWorkspace = state.workspaces.find(
      (workspace) => workspace.id === defaltValue?.id
    );
    if (findSelectedWorkspace) setSelectedOption(findSelectedWorkspace);
  }, [state, defaltValue]);

  return (
    <div
      className="relative
  inline-block
  text-left"
    >
      <div>
        <span onClick={() => setIsOpen(!isOpen)}>
          {selectedOption ? (
            <SelectedWorkspace workspace={selectedOption} />
          ) : (
            "Select a workspace"
          )}
        </span>
      </div>
      {isOpen && (
        <div
          className="origin-top-right
          absolute
          rounded-md
          shadow-md
          z-50
          max-h-[260px]
          w-[250px]
          bg-black
          backdrop-blue-lg
          group
          overflow-hidden
          overflow-y-auto
          border-[1px]
          border-muted"
        >
          <div className="rounded-md flex flex-col">
            <div className="!p-2">
              {!!privateWorkspace.length && (
                <>
                  <p className="text-muted-foreground">Private</p>
                  <hr></hr>
                  {privateWorkspace.map((option) => {
                    return (
                      <SelectedWorkspace
                        key={option.id}
                        workspace={option}
                        onClick={handleSelect}
                      />
                    );
                  })}
                </>
              )}
              {!!sharedWorkspace.length && (
                <>
                  <p className="text-muted-foreground">Shared</p>
                  <hr></hr>
                  {sharedWorkspace.map((option) => {
                    return (
                      <SelectedWorkspace
                        key={option.id}
                        workspace={option}
                        onClick={handleSelect}
                      />
                    );
                  })}
                </>
              )}
              {!!collaboratingWorkspace.length && (
                <>
                  <p className="text-muted-foreground">Collaborating</p>
                  <hr></hr>
                  {collaboratingWorkspace.map((option) => {
                    return (
                      <SelectedWorkspace
                        key={option.id}
                        workspace={option}
                        onClick={handleSelect}
                      />
                    );
                  })}
                </>
              )}
            </div>
            <CustomDialogTrigger
              header="Create A Workspace"
              content={<WorkspaceCreator />}
              description="Workspaces give you the power to collaborate with others. You can change your workspace privacy settings after creating the workspace too."
            >
              <div
                className="flex 
                transition-all 
                hover:bg-muted 
                justify-center 
                items-center 
                gap-2 
                p-2 
                mb-3
                mr-2
                ml-2
                rounded-md"
              >
                <article
                  className="text-slate-500
                  text-xl
                  rounded-full
                  bg-slate-800
                  w-6
                  h-6
                  flex
                  items-center
                  justify-center
                  text-center
                  leading-none
                "
                >
                  <Plus height={16} />
                </article>
                Create Workspace
              </div>
            </CustomDialogTrigger>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDropdown;

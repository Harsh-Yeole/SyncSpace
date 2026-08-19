'use client';
import { useAppState } from "@/lib/providers/state-provider";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "../ui/button";
import { createClientSupabaseClient } from "@/lib/supabase/create-client-supabase";

interface LogoutButtonProps {
  children: React.ReactNode;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ children }) => {
  // const { user } = useSupabaseUser();
  const { dispatch } = useAppState();
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const logout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    dispatch({ type: "SET_WORKSPACES", payload: { workspaces: [] } });
  };
  return (
    <Button variant="ghost" size="icon" className="p-0 bg-white/10" onClick={logout}>
      {children}
    </Button>
  );
};

export default LogoutButton;

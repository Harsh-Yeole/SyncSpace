import MobileSidebar from "@/components/sidebar/mobile-sidebar";
import Sidebar from "@/components/sidebar/sidebar";
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}

const Layout: React.FC<LayoutProps> = async (props) => {
  const params = await props.params;

  const { children } = props;

  return (
    <main
      className="flex overflow-hidden
  h-screen
  w-screen"
    >
      <Sidebar params={params} />
      <MobileSidebar>
        <Sidebar params={params} className="w-screen inline-block sm:hidden" />
      </MobileSidebar>

      <div
        className="dark:border-Neutrals-12/70
    border-l-[1px]
    w-full
    relative
    flex
    flex-col
    "
      >
        {children}
      </div>
    </main>
  );
};

export default Layout;

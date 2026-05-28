import React, { useState } from "react";
import { SidebarMenu } from "./SidebarMenu";
import Header from "./Header";
import { useAppPermissions } from "@/hooks/usePermissions";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, loading } = useAppPermissions();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return null;
  }

  // If not admin, we shouldn't even be here (ProtectedRoute handles this)
  // but as a fallback, we just render the children or a message
  if (!isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 fixed inset-y-0 left-0 z-50 border-r bg-sidebar">
          <SidebarMenu />
        </aside>
      )}

      {/* Main Content Area */}
      <div className={cn("flex-1 flex flex-col", !isMobile && "pl-64")}>
        <Header />
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

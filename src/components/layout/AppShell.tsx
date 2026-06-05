import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { SidebarMenu } from "@/components/SidebarMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLocation } from "react-router-dom";

interface AppShellProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

export function AppShell({ 
  children, 
  showSidebar = false,
  maxWidth = "lg" 
}: AppShellProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { isAdmin, isMaster, isPromoter } = useAppPermissions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Automatically show sidebar for admins/masters if not explicitly false
  const effectiveShowSidebar = showSidebar || (isAdmin || isMaster || isPromoter);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const maxWidthClasses = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-7xl",
    xl: "max-w-[1400px]",
    full: "max-w-none"
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/10 overflow-x-hidden relative">
      {/* Sidebar for Desktop */}
      {effectiveShowSidebar && !isMobile && user && (
        <aside className="w-72 fixed inset-y-0 left-0 z-40 border-r border-border bg-sidebar shadow-sm">
          <SidebarMenu />
        </aside>
      )}

      {/* Main Container */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300 w-full",
        effectiveShowSidebar && !isMobile && user ? "md:pl-72" : "pl-0"
      )}>
        {/* Unified Header */}
        <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        {/* Page Content */}
        <main className={cn(
          "flex-1 w-full mx-auto p-4 md:p-8 overflow-x-hidden",
          maxWidthClasses[maxWidth]
        )}>
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full py-8 px-4 border-t border-border mt-auto bg-muted/30">
          <div className={cn("mx-auto flex flex-col md:flex-row justify-between items-center gap-4", maxWidthClasses[maxWidth])}>
            <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="font-display text-sm font-black text-primary tracking-tight">AgendIlha</span>
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Coé a Boa?</span>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 text-center md:text-left">
              © {new Date().getFullYear()} AgendIlha · Transparência e Cultura
            </p>
          </div>
        </footer>
      </div>

      {/* Mobile Menu Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[280px] sm:w-80 bg-sidebar border-r border-border">
          <SidebarMenu onClose={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

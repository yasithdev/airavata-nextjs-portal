"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  FlaskConical,
  AppWindow,
  HardDrive,
  Settings,
  Server,
  Database,
  Users,
  Building2,
  X,
  BookOpen,
  UsersRound,
  Key,
  Shield,
  Bell,
  BarChart3,
  FileCode,
  Award,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGateway } from "@/contexts/GatewayContext";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/experiments", label: "Experiments", icon: FlaskConical },
  { href: "/applications", label: "Applications", icon: AppWindow },
  { href: "/storage", label: "Storage", icon: HardDrive },
  { href: "/catalog", label: "Catalog", icon: BookOpen },
  { href: "/groups", label: "Groups", icon: UsersRound },
];

// Gateway Administration - scoped to the selected gateway
const gatewayAdminItems = [
  { href: "/admin/applications", label: "App Management", icon: AppWindow },
  { href: "/admin/resource-profiles", label: "Resource Profiles", icon: Shield },
  { href: "/admin/gateway-profile", label: "Gateway Profile", icon: Award },
  { href: "/admin/credentials", label: "Credentials", icon: Key },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/data-products", label: "Data Products", icon: Database },
  { href: "/admin/notices", label: "Notices", icon: Bell },
  { href: "/admin/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// System Administration - global resources, only visible to root users
const systemAdminItems = [
  { href: "/admin/gateways", label: "Gateways", icon: Building2 },
  { href: "/admin/compute-resources", label: "Compute Resources", icon: Server },
  { href: "/admin/storage-resources", label: "Storage Resources", icon: Database },
  { href: "/admin/workflows", label: "Workflows", icon: FileCode },
  { href: "/admin/parsers", label: "Data Parsers", icon: FileCode },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isRootUser } = useGateway();

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    
    return (
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b px-4 md:hidden">
        <span className="font-semibold">Navigation</span>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-4">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <Separator className="my-4" />

        {/* Gateway Administration - scoped to selected gateway */}
        <div className="px-4">
          <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Gateway Administration
          </h4>
          <nav className="grid gap-1">
            {gatewayAdminItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
        </div>

        {/* System Administration - only visible to root users */}
        {isRootUser && (
          <>
            <Separator className="my-4" />
            <div className="px-4">
              <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Globe className="h-3 w-3" />
                System Administration
              </h4>
              <nav className="grid gap-1">
                {systemAdminItems.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </nav>
            </div>
          </>
        )}
      </div>

      <div className="border-t p-4">
        <Link
          href="/account"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Account
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
        {sidebarContent}
      </aside>
    </>
  );
}

import { Link, useForm, usePage } from "@inertiajs/react";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SharedProps } from "@/types/global";
import { useFlashToasts } from "@/hooks/useFlashToast";
import { Button } from "@/components/ui/button";
import {
  Flag,
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  Crosshair,
  Palette,
  LogOut,
} from "lucide-react";

interface Props {
  children: ReactNode;
  activePage?: "dashboard" | "projects" | "docs" | "strategies" | "brand";
  overlay?: boolean;
}

const isBandeiraApp =
  typeof window !== "undefined" &&
  window.location.hostname.endsWith("bandeira.app");

export default function PublicLayout({
  children,
  activePage,
  overlay = false,
}: Props) {
  const { flash, auth } = usePage<SharedProps>().props;

  useFlashToasts(flash);

  const { post, processing } = useForm({});
  const handleLogout = () => post("/user/logout");

  const navLinkClass = (page?: string) =>
    page === activePage
      ? "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-accent text-accent-foreground"
      : "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors";

  const header = (
    <header
      className={
        overlay
          ? "absolute top-0 left-0 right-0 z-50"
          : "border-b border-border bg-card"
      }
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Flag className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
              Bandeira
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {auth?.user && (
              <>
                <Link href="/dashboard" className={navLinkClass("dashboard")}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link href="/projects" className={navLinkClass("projects")}>
                  <FolderOpen className="w-4 h-4" />
                  Projects
                </Link>
              </>
            )}
            <Link href="/strategies" className={navLinkClass("strategies")}>
              <Crosshair className="w-4 h-4" />
              Strategies
            </Link>
            <Link href="/docs" className={navLinkClass("docs")}>
              <BookOpen className="w-4 h-4" />
              Docs
            </Link>
            <Link href="/brand" className={navLinkClass("brand")}>
              <Palette className="w-4 h-4" />
              Brand
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {auth?.user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {auth.user.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </span>
                </div>
                <span>{auth.user.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={processing}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            !isBandeiraApp && (
              <Link
                href="/user/login"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Toaster />
      {header}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}

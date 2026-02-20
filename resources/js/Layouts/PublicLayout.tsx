import { Link, useForm, usePage } from "@inertiajs/react";
import { ReactNode, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SharedProps } from "@/types/global";
import { useFlashToasts } from "@/hooks/useFlashToast";
import { Menu, X } from "lucide-react";

interface Props {
  children: ReactNode;
  activePage?: "dashboard" | "projects" | "docs" | "strategies" | "brand" | "users";
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinkClass = (page?: string) =>
    page === activePage
      ? "flex items-center gap-2 px-3 py-2 text-sm font-medium bg-muted text-foreground"
      : "flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors";

  const header = (
    <header
      className={
        overlay
          ? "absolute top-0 left-0 right-0 z-50"
          : "border-b border-border bg-card"
      }
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-6">
          <Link href="/" className="group">
            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {">"} bandeira
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {auth?.user && (
              <>
                <Link href="/dashboard" className={navLinkClass("dashboard")}>
                  dashboard
                </Link>
                <Link href="/projects" className={navLinkClass("projects")}>
                  projects
                </Link>
                {auth.user.role === "admin" && (
                  <Link href="/users" className={navLinkClass("users")}>
                    users
                  </Link>
                )}
              </>
            )}
            <Link href="/strategies" className={navLinkClass("strategies")}>
              strategies
            </Link>
            <Link href="/docs" className={navLinkClass("docs")}>
              docs
            </Link>
            <Link href="/brand" className={navLinkClass("brand")}>
              brand
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {auth?.user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{auth.user.name}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={processing}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                [sign_out]
              </button>
            </>
          ) : (
            !isBandeiraApp && (
              <Link
                href="/user/login"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                [sign_in]
              </Link>
            )
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
          {auth?.user && (
            <>
              <Link
                href="/dashboard"
                className={navLinkClass("dashboard")}
                onClick={() => setMobileMenuOpen(false)}
              >
                dashboard
              </Link>
              <Link
                href="/projects"
                className={navLinkClass("projects")}
                onClick={() => setMobileMenuOpen(false)}
              >
                projects
              </Link>
              {auth.user.role === "admin" && (
                <Link
                  href="/users"
                  className={navLinkClass("users")}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  users
                </Link>
              )}
            </>
          )}
          <Link
            href="/strategies"
            className={navLinkClass("strategies")}
            onClick={() => setMobileMenuOpen(false)}
          >
            strategies
          </Link>
          <Link
            href="/docs"
            className={navLinkClass("docs")}
            onClick={() => setMobileMenuOpen(false)}
          >
            docs
          </Link>
          <Link
            href="/brand"
            className={navLinkClass("brand")}
            onClick={() => setMobileMenuOpen(false)}
          >
            brand
          </Link>
        </nav>
      )}
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

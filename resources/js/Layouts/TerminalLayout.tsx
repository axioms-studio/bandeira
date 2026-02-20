import { Link, useForm, usePage } from "@inertiajs/react";
import { ReactNode, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SharedProps } from "@/types/global";
import { useFlashToasts } from "@/hooks/useFlashToast";
import { Menu, X } from "lucide-react";

interface Props {
  children: ReactNode;
  activePage?: "dashboard" | "projects" | "users" | "strategies" | "docs";
}

export default function TerminalLayout({ children, activePage }: Props) {
  const { flash, auth } = usePage<SharedProps>().props;
  useFlashToasts(flash);

  const { post, processing } = useForm({});
  const handleLogout = () => post("/user/logout");

  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { key: "dashboard", href: "/dashboard", label: "dashboard" },
    { key: "projects", href: "/projects", label: "projects" },
    ...(auth?.user?.role === "admin"
      ? [{ key: "users", href: "/users", label: "users" }]
      : []),
    { key: "strategies", href: "/strategies", label: "strategies" },
    { key: "docs", href: "/docs", label: "docs" },
  ];

  const sidebar = (
    <aside className="fixed top-0 left-0 bottom-0 w-60 border-r border-border bg-card flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <Link href="/" className="group">
          <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {">"} bandeira
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            // feature_flags
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
              activePage === item.key
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                activePage === item.key ? "bg-primary" : "bg-transparent"
              }`}
            />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom: user info */}
      {auth?.user && (
        <div className="px-5 py-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-sm text-foreground truncate">
              {auth.user.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground border border-border px-1.5 py-0.5">
              [{auth.user.role}]
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={processing}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              [sign_out]
            </button>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />

      {/* Desktop sidebar */}
      <div className="hidden md:block">{sidebar}</div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-12 border-b border-border bg-card flex items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold text-foreground">
          {">"} bandeira
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-muted-foreground hover:text-foreground"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed top-12 left-0 bottom-0 w-60 border-r border-border bg-card flex flex-col z-50">
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                    activePage === item.key
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      activePage === item.key ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                  {item.label}
                </Link>
              ))}
            </nav>
            {auth?.user && (
              <div className="px-5 py-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-sm text-foreground truncate">
                    {auth.user.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground border border-border px-1.5 py-0.5">
                    [{auth.user.role}]
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={processing}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    [sign_out]
                  </button>
                </div>
              </div>
            )}
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="md:ml-60 pt-12 md:pt-0 min-h-screen">
        <div className="p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}

import { Link, usePage } from "@inertiajs/react";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SharedProps } from "@/types/global";
import { useFlashToasts } from "@/hooks/useFlashToast";
import { Flag } from "lucide-react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { flash, auth } = usePage<SharedProps>().props;

  useFlashToasts(flash);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Toaster />
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
            <Flag className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
            Bandeira
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/docs"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </Link>
          <Link
            href="/strategies"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Strategies
          </Link>
          {auth?.user ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            typeof window !== "undefined" &&
            !window.location.hostname.endsWith("bandeira.app") && (
              <Link
                href="/user/login"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Sign in
              </Link>
            )
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}

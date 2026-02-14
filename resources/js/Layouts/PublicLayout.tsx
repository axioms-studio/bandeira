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
    <div className="min-h-screen text-foreground flex flex-col">
      <Toaster />
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
            <Flag className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
            Bandeira
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          {auth?.user ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/user/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-grow flex items-center justify-center flex-col">
        {children}
      </main>
    </div>
  );
}

import { Link } from "@inertiajs/react";

export function AppHeader() {
  return (
    <div className="border-b border-sidebar-border/80">
      <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
        <Link href="/" className="flex items-center space-x-2 font-semibold">
          <span>Bandeira</span>
        </Link>
      </div>
    </div>
  );
}

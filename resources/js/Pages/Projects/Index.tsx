import { Link, useForm, usePage } from "@inertiajs/react";
import { SharedProps } from "@/types/global";
import { useFlashToasts } from "@/hooks/useFlashToast";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Flag,
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  ToggleRight,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";

interface ProjectItem {
  id: number;
  name: string;
  description: string;
  flagCount: number;
  environmentCount: number;
  createdAt: string;
}

interface Props {
  projects: ProjectItem[];
}

export default function Index() {
  const { flash, auth } = usePage<SharedProps>().props;
  const { projects } = usePage<SharedProps & Props>().props;
  useFlashToasts(flash);

  const { post, processing } = useForm({});

  const handleLogout = () => {
    post("/user/logout");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster />

      {/* Top nav */}
      <header className="border-b border-border bg-card">
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
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-accent text-accent-foreground"
              >
                <FolderOpen className="w-4 h-4" />
                Projects
              </Link>
              <Link
                href="/docs"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Docs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">A</span>
              </div>
              <span>{auth?.user?.name}</span>
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
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Page heading */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Projects
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Manage your feature flag projects
              </p>
            </div>
            <Button asChild>
              <Link href="/projects/create">
                <Plus className="w-4 h-4" />
                Create Project
              </Link>
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="bg-card border border-border rounded-xl shadow-sm">
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-2xl mb-5">
                  <FolderOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  No projects yet
                </h2>
                <p className="text-muted-foreground text-sm max-w-md mb-6">
                  Get started by creating your first project. Projects contain
                  feature flags, environments, and API tokens.
                </p>
                <Link href="/projects/create">
                  <Button>
                    <Plus className="w-4 h-4" />
                    Create Project
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block"
                >
                  <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all">
                    <h3 className="font-semibold text-foreground mb-1">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    {!project.description && <div className="mb-4" />}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ToggleRight className="w-3.5 h-3.5" />
                        {project.flagCount} flags
                      </span>
                      <span className="flex items-center gap-1">
                        <Settings className="w-3.5 h-3.5" />
                        {project.environmentCount} envs
                      </span>
                      <span className="ml-auto">{project.createdAt}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

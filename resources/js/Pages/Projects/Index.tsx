import { Link, usePage } from "@inertiajs/react";
import { SharedProps } from "@/types/global";
import PublicLayout from "@/Layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  ToggleRight,
  Settings,
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
  const { projects } = usePage<SharedProps & Props>().props;

  return (
    <PublicLayout activePage="projects">
      <div className="mx-auto max-w-7xl px-6 py-8 w-full">
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
    </PublicLayout>
  );
}

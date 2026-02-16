import { Link, usePage } from "@inertiajs/react";
import { SharedProps } from "@/types/global";
import PublicLayout from "@/Layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Flag,
  FolderOpen,
  ToggleRight,
  Settings,
  Plus,
  ArrowRight,
} from "lucide-react";

interface RecentProject {
  id: number;
  name: string;
  description: string;
  flagCount: number;
  environmentCount: number;
  createdAt: string;
}

interface DashboardProps {
  projectCount: number;
  flagCount: number;
  environmentCount: number;
  recentProjects: RecentProject[];
}

export default function Dashboard() {
  const { projectCount, flagCount, environmentCount, recentProjects } =
    usePage<SharedProps & DashboardProps>().props;

  return (
    <PublicLayout activePage="dashboard">
      <div className="mx-auto max-w-7xl px-6 py-8 w-full">
          {/* Page heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage your feature flags and projects
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-9 h-9 bg-primary/10 rounded-lg">
                  <FolderOpen className="w-4.5 h-4.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Projects
                </span>
              </div>
              <p className="text-3xl font-semibold text-foreground">
                {projectCount}
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-9 h-9 bg-accent rounded-lg">
                  <ToggleRight className="w-4.5 h-4.5 text-accent-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Feature Flags
                </span>
              </div>
              <p className="text-3xl font-semibold text-foreground">
                {flagCount}
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-9 h-9 bg-secondary/10 rounded-lg">
                  <Settings className="w-4.5 h-4.5 text-secondary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Environments
                </span>
              </div>
              <p className="text-3xl font-semibold text-foreground">
                {environmentCount}
              </p>
            </div>
          </div>

          {/* Recent projects or empty state */}
          {recentProjects && recentProjects.length > 0 ? (
            <div className="bg-card border border-border rounded-xl shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">
                  Recent Projects
                </h2>
                <Link
                  href="/projects"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-border">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <span className="font-medium text-foreground text-sm">
                        {project.name}
                      </span>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ToggleRight className="w-3.5 h-3.5" />
                        {project.flagCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Settings className="w-3.5 h-3.5" />
                        {project.environmentCount}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl shadow-sm">
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-2xl mb-5">
                  <Flag className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  No feature flags yet
                </h2>
                <p className="text-muted-foreground text-sm max-w-md mb-6">
                  Get started by creating your first project and adding feature
                  flags to control your application's behavior.
                </p>
                <Button asChild>
                  <Link href="/projects/create">
                    <Plus className="w-4 h-4" />
                    Create Project
                  </Link>
                </Button>
              </div>
            </div>
          )}
      </div>
    </PublicLayout>
  );
}

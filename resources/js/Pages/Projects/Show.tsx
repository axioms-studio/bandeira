import { Link, useForm, usePage, router } from "@inertiajs/react";
import { useState, useCallback } from "react";
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
  Pencil,
  Trash2,
  ArrowLeft,
  Plus,
  Key,
} from "lucide-react";

interface FlagItem {
  id: number;
  name: string;
  description: string;
  flagType: string;
  createdAt: string;
}

interface EnvItem {
  id: number;
  name: string;
  type: string;
  sortOrder: number;
}

interface ToggleState {
  flagId: number;
  environmentId: number;
  enabled: boolean;
}

interface ProjectDetail {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  flags: FlagItem[];
  environments: EnvItem[];
  toggles: ToggleState[];
}

interface Props {
  project: ProjectDetail;
}

export default function Show() {
  const { flash, auth } = usePage<SharedProps>().props;
  const { project } = usePage<SharedProps & Props>().props;
  useFlashToasts(flash);

  const { post: logoutPost, processing: logoutProcessing } = useForm({});
  const handleLogout = () => logoutPost("/user/logout");

  const handleDeleteProject = () => {
    if (confirm("Are you sure you want to delete this project?")) {
      router.delete(`/projects/${project.id}`);
    }
  };

  const handleDeleteEnv = (envId: number) => {
    if (confirm("Are you sure you want to delete this environment?")) {
      router.delete(
        `/projects/${project.id}/environments/${envId}`,
      );
    }
  };

  const handleDeleteFlag = (flagId: number) => {
    if (confirm("Are you sure you want to delete this flag?")) {
      router.delete(`/projects/${project.id}/flags/${flagId}`);
    }
  };

  // Local toggle state for optimistic UI
  const [toggleMap, setToggleMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    if (project.toggles) {
      for (const t of project.toggles) {
        map[`${t.flagId}-${t.environmentId}`] = t.enabled;
      }
    }
    return map;
  });

  const getToggle = useCallback(
    (flagId: number, envId: number) => {
      return toggleMap[`${flagId}-${envId}`] ?? false;
    },
    [toggleMap],
  );

  const handleToggle = useCallback(
    async (flagId: number, envId: number) => {
      const key = `${flagId}-${envId}`;
      const current = toggleMap[key] ?? false;
      const next = !current;

      // Optimistic update
      setToggleMap((prev) => ({ ...prev, [key]: next }));

      try {
        const csrfCookie = document.cookie
          .split("; ")
          .find((c) => c.startsWith("XSRF-TOKEN="));
        const csrfToken = csrfCookie
          ? decodeURIComponent(csrfCookie.split("=")[1])
          : "";

        const res = await fetch(
          `/projects/${project.id}/flags/${flagId}/toggle`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-XSRF-TOKEN": csrfToken,
            },
            body: JSON.stringify({ environmentId: envId, enabled: next }),
          },
        );

        if (!res.ok) {
          // Revert on failure
          setToggleMap((prev) => ({ ...prev, [key]: current }));
        }
      } catch {
        // Revert on network error
        setToggleMap((prev) => ({ ...prev, [key]: current }));
      }
    },
    [toggleMap, project.id],
  );

  const sortedEnvs = [...project.environments].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const hasMatrix =
    project.flags.length > 0 && project.environments.length > 0;

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
              disabled={logoutProcessing}
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
          {/* Back link */}
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to projects
          </Link>

          {/* Project header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {project.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Created {project.createdAt}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/${project.id}/edit`}>
                  <Pencil className="w-4 h-4" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteProject}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* Flag Matrix */}
          {hasMatrix && (
            <div className="bg-card border border-border rounded-xl shadow-sm mb-6 overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Flag Matrix</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Toggle flags across environments. Rows are flags, columns are
                  environments.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 min-w-[200px]">
                        Flag
                      </th>
                      {sortedEnvs.map((env) => (
                        <th
                          key={env.id}
                          className="text-center text-xs font-medium text-muted-foreground px-4 py-3 min-w-[100px]"
                        >
                          <div>{env.name}</div>
                          <div className="text-[10px] opacity-60 font-normal">
                            {env.type}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {project.flags.map((flag) => (
                      <tr
                        key={flag.id}
                        className="hover:bg-accent/30 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <span className="font-medium text-foreground text-sm">
                                {flag.name}
                              </span>
                              <span className="ml-2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {flag.flagType.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                          {flag.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {flag.description}
                            </p>
                          )}
                        </td>
                        {sortedEnvs.map((env) => {
                          const enabled = getToggle(flag.id, env.id);
                          return (
                            <td key={env.id} className="text-center px-4 py-3">
                              <button
                                type="button"
                                onClick={() => handleToggle(flag.id, env.id)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                  enabled
                                    ? "bg-primary"
                                    : "bg-muted-foreground/20"
                                }`}
                                role="switch"
                                aria-checked={enabled}
                                aria-label={`Toggle ${flag.name} in ${env.name}`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                    enabled
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Flags section */}
          <div className="bg-card border border-border rounded-xl shadow-sm mb-6">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Feature Flags</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/${project.id}/flags/create`}>
                  <Plus className="w-4 h-4" />
                  Add Flag
                </Link>
              </Button>
            </div>
            {project.flags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <ToggleRight className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  No feature flags yet.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/projects/${project.id}/flags/create`}>
                    <Plus className="w-4 h-4" />
                    Create your first flag
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {project.flags.map((flag) => (
                  <div
                    key={flag.id}
                    className="px-5 py-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-foreground text-sm">
                        {flag.name}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {flag.flagType.replace("_", " ")}
                      </span>
                      {flag.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {flag.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        asChild
                      >
                        <Link
                          href={`/projects/${project.id}/flags/${flag.id}/edit`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteFlag(flag.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Environments section */}
          <div className="bg-card border border-border rounded-xl shadow-sm mb-6">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Environments</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/${project.id}/environments/create`}>
                  <Plus className="w-4 h-4" />
                  Add Environment
                </Link>
              </Button>
            </div>
            {project.environments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <Settings className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  No environments yet.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/projects/${project.id}/environments/create`}>
                    <Plus className="w-4 h-4" />
                    Create your first environment
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sortedEnvs.map((env) => (
                  <div
                    key={env.id}
                    className="px-5 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm">
                        {env.name}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {env.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        asChild
                      >
                        <Link
                          href={`/projects/${project.id}/environments/${env.id}/edit`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteEnv(env.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* API Tokens section */}
          <div className="bg-card border border-border rounded-xl shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">API Tokens</h2>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/${project.id}/api-tokens`}>
                  Manage Tokens
                </Link>
              </Button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-muted-foreground">
                Create and manage API tokens for SDK access to this project's feature flags.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

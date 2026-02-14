import { Link, useForm, usePage, router } from "@inertiajs/react";
import { useState } from "react";
import { SharedProps } from "@/types/global";
import { useFlashToasts } from "@/hooks/useFlashToast";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Flag,
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  LogOut,
  ArrowLeft,
  Plus,
  Trash2,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

interface TokenItem {
  id: number;
  name: string;
  tokenType: string;
  environment: string;
  plainToken: string;
  createdAt: string;
}

interface Props {
  project: { id: number; name: string };
  tokens: TokenItem[];
}

export default function Index() {
  const { flash, auth } = usePage<SharedProps>().props;
  const { project, tokens } = usePage<SharedProps & Props>().props;
  useFlashToasts(flash);

  const { post: logoutPost, processing: logoutProcessing } = useForm({});
  const handleLogout = () => logoutPost("/user/logout");

  const [visibleTokens, setVisibleTokens] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const toggleVisibility = (id: number) => {
    setVisibleTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = async (id: number, plainToken: string) => {
    await navigator.clipboard.writeText(plainToken);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (tokenId: number) => {
    if (confirm("Are you sure you want to revoke this token? This cannot be undone.")) {
      router.delete(`/projects/${project.id}/api-tokens/${tokenId}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster />

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

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {project.name}
          </Link>

          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                API Tokens
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Manage API tokens for {project.name}.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${project.id}/api-tokens/create`}>
                <Plus className="w-4 h-4" />
                Add Token
              </Link>
            </Button>
          </div>

          {/* Token list */}
          <div className="bg-card border border-border rounded-xl shadow-sm">
            {tokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <Key className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  No API tokens yet.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/projects/${project.id}/api-tokens/create`}>
                    <Plus className="w-4 h-4" />
                    Create your first token
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {tokens.map((tok) => (
                  <div key={tok.id} className="px-5 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground text-sm">
                              {tok.name}
                            </span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                              {tok.tokenType}
                            </span>
                            {tok.environment && (
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                {tok.environment}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Created {tok.createdAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleVisibility(tok.id)}
                          title={visibleTokens[tok.id] ? "Hide token" : "Show token"}
                        >
                          {visibleTokens[tok.id] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleCopy(tok.id, tok.plainToken)}
                          title="Copy token"
                        >
                          {copiedId === tok.id ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(tok.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Revoke
                        </Button>
                      </div>
                    </div>
                    {visibleTokens[tok.id] && (
                      <code className="block bg-muted text-foreground px-3 py-2 rounded-lg text-xs font-mono break-all select-all">
                        {tok.plainToken}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

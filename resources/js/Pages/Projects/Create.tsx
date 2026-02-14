import { Link, useForm, usePage } from "@inertiajs/react";
import { FormEventHandler } from "react";
import { SharedProps } from "@/types/global";
import { useFlashToasts } from "@/hooks/useFlashToast";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InputError from "@/components/InputError";
import {
  Flag,
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  LogOut,
  Loader2,
} from "lucide-react";

export default function Create() {
  const { flash, auth } = usePage<SharedProps>().props;
  const errors = usePage().props.errors as Record<string, string[]> | undefined;
  useFlashToasts(flash);

  const { post: logoutPost, processing: logoutProcessing } = useForm({});

  const handleLogout = () => {
    logoutPost("/user/logout");
  };

  const { data, setData, post, processing } = useForm({
    name: "",
    description: "",
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post("/projects");
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
        <div className="mx-auto max-w-2xl px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Create Project
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              A project groups feature flags, environments, and API tokens
              together.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. My App"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  aria-invalid={!!errors?.Name}
                  className="h-11"
                />
                {errors?.Name?.map((msg, i) => (
                  <InputError key={i} message={msg} />
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="A short description of this project"
                  value={data.description}
                  onChange={(e) => setData("description", e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
                <Link
                  href="/projects"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

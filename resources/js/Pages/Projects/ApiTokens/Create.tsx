import { Link, useForm, usePage } from "@inertiajs/react";
import { FormEventHandler } from "react";
import { SharedProps } from "@/types/global";
import { useFlashToasts } from "@/hooks/useFlashToast";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InputError from "@/components/InputError";
import {
  Flag,
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  LogOut,
  Loader2,
  ArrowLeft,
} from "lucide-react";

interface Props {
  project: { id: number; name: string };
  environments: { id: number; name: string }[];
}

export default function Create() {
  const { flash, auth } = usePage<SharedProps>().props;
  const { project, environments } = usePage<SharedProps & Props>().props;
  const errors = usePage().props.errors as Record<string, string[]> | undefined;
  useFlashToasts(flash);

  const { post: logoutPost, processing: logoutProcessing } = useForm({});
  const handleLogout = () => logoutPost("/user/logout");

  const { data, setData, post, processing } = useForm({
    name: "",
    token_type: "client",
    environment: "",
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(`/projects/${project.id}/api-tokens`);
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
        <div className="mx-auto max-w-2xl px-6 py-8">
          <Link
            href={`/projects/${project.id}/api-tokens`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to API Tokens
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Create API Token
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Create a new API token for {project.name}.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Production SDK Token"
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
                <Label>Token Type</Label>
                <Select
                  value={data.token_type}
                  onValueChange={(value) => setData("token_type", value)}
                >
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors?.TokenType?.map((msg, i) => (
                  <InputError key={i} message={msg} />
                ))}
              </div>

              {data.token_type === "client" && (
                <div className="space-y-2">
                  <Label>Environment</Label>
                  <Select
                    value={data.environment}
                    onValueChange={(value) => setData("environment", value)}
                  >
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Select an environment" />
                    </SelectTrigger>
                    <SelectContent>
                      {environments.map((env) => (
                        <SelectItem key={env.id} value={env.name}>
                          {env.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors?.Environment?.map((msg, i) => (
                    <InputError key={i} message={msg} />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Token"
                  )}
                </Button>
                <Link
                  href={`/projects/${project.id}/api-tokens`}
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

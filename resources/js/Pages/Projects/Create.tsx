import { Link, useForm, usePage } from "@inertiajs/react";
import { FormEventHandler } from "react";
import { SharedProps } from "@/types/global";
import PublicLayout from "@/Layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InputError from "@/components/InputError";
import { Loader2 } from "lucide-react";

export default function Create() {
  const errors = usePage().props.errors as Record<string, string[]> | undefined;

  const { data, setData, post, processing } = useForm({
    name: "",
    description: "",
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post("/projects");
  };

  return (
    <PublicLayout activePage="projects">
      <div className="mx-auto max-w-2xl px-6 py-8 w-full">
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
    </PublicLayout>
  );
}

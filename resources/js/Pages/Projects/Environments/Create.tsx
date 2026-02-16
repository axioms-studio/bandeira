import { Link, useForm, usePage } from "@inertiajs/react";
import { FormEventHandler } from "react";
import { SharedProps } from "@/types/global";
import PublicLayout from "@/Layouts/PublicLayout";
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
import { Loader2, ArrowLeft } from "lucide-react";

interface Props {
  project: { id: number; name: string };
}

export default function Create() {
  const { project } = usePage<SharedProps & Props>().props;
  const errors = usePage().props.errors as Record<string, string[]> | undefined;

  const { data, setData, post, processing } = useForm({
    name: "",
    type: "development",
    sort_order: "0",
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(`/projects/${project.id}/environments`);
  };

  return (
    <PublicLayout activePage="projects">
      <div className="mx-auto max-w-2xl px-6 py-8 w-full">
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {project.name}
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Create Environment
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Add a new environment to {project.name}.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Production"
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
                <Label>Type</Label>
                <Select
                  value={data.type}
                  onValueChange={(value) => setData("type", value)}
                >
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
                {errors?.Type?.map((msg, i) => (
                  <InputError key={i} message={msg} />
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">
                  Sort Order{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  placeholder="0"
                  value={data.sort_order}
                  onChange={(e) => setData("sort_order", e.target.value)}
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
                    "Create Environment"
                  )}
                </Button>
                <Link
                  href={`/projects/${project.id}`}
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

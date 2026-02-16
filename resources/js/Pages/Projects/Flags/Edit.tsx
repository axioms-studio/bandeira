import { Link, useForm, usePage } from "@inertiajs/react";
import { FormEventHandler, useState, useMemo } from "react";
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
import StrategyList from "./components/StrategyList";

interface EnvItem {
  id: number;
  name: string;
  type: string;
  sortOrder: number;
}

interface ToggleState {
  environmentId: number;
  enabled: boolean;
}

interface Props {
  project: { id: number; name: string };
  flag: {
    id: number;
    name: string;
    description: string;
    flagType: string;
  };
  environments: EnvItem[];
  toggles: ToggleState[];
}

export default function Edit() {
  const { project, flag, environments, toggles } = usePage<
    SharedProps & Props
  >().props;
  const errors = usePage().props.errors as Record<string, string[]> | undefined;

  const { data, setData, put, processing } = useForm({
    name: flag.name,
    description: flag.description || "",
    flag_type: flag.flagType,
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    put(`/projects/${project.id}/flags/${flag.id}`);
  };

  const sortedEnvs = useMemo(
    () => [...(environments ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [environments]
  );

  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(
    sortedEnvs.length > 0 ? sortedEnvs[0].id : null
  );

  const csrfToken = useMemo(() => {
    const cookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("XSRF-TOKEN="));
    return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
  }, []);

  return (
    <PublicLayout activePage="projects">
      <div className="mx-auto max-w-4xl px-6 py-8 w-full">
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {project.name}
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Edit Flag
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Update flag details for {project.name}.
            </p>
          </div>

          {/* Flag metadata form */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 mb-8">
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. new-dashboard"
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
                  placeholder="What does this flag control?"
                  value={data.description}
                  onChange={(e) => setData("description", e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={data.flag_type}
                  onValueChange={(value) => setData("flag_type", value)}
                >
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="release">Release</SelectItem>
                    <SelectItem value="experiment">Experiment</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="kill_switch">Kill Switch</SelectItem>
                  </SelectContent>
                </Select>
                {errors?.FlagType?.map((msg, i) => (
                  <InputError key={i} message={msg} />
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
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

          {/* Strategy Configuration */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-foreground">
                Strategy Configuration
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure rollout strategies per environment.
              </p>
            </div>

            {sortedEnvs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">
                  No environments configured for this project.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/projects/${project.id}/environments/create`}
                  >
                    Add environments first
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                {/* Environment tabs */}
                <div className="flex gap-1 border-b border-border mb-5">
                  {sortedEnvs.map((env) => (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => setSelectedEnvId(env.id)}
                      className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                        selectedEnvId === env.id
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {env.name}
                      <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">
                        {env.type}
                      </span>
                      {selectedEnvId === env.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Strategy list for selected env */}
                {selectedEnvId && (
                  <StrategyList
                    key={selectedEnvId}
                    projectId={project.id}
                    flagId={flag.id}
                    environmentId={selectedEnvId}
                    csrfToken={csrfToken}
                  />
                )}
              </>
            )}
          </div>
      </div>
    </PublicLayout>
  );
}

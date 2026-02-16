import { Link, usePage } from "@inertiajs/react";
import { SharedProps } from "@/types/global";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import PublicLayout from "@/Layouts/PublicLayout";
import {
  ToggleRight,
  Users,
  Shield,
  Zap,
  Github,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: ToggleRight,
    title: "Per-Environment Toggles",
    description:
      "Enable flags independently across development, staging, and production.",
  },
  {
    icon: Users,
    title: "Targeting Strategies",
    description:
      "Roll out to specific users, percentages, or IP ranges with built-in strategies.",
    href: "/strategies",
  },
  {
    icon: Shield,
    title: "Constraint Engine",
    description:
      "AND/OR logic with operators like IN, STR_CONTAINS, NUM_GT, and date comparisons.",
    href: "/strategies",
  },
  {
    icon: Zap,
    title: "Zero-Latency SDK",
    description:
      "Go SDK polls and caches locally — flag checks are pure in-memory lookups.",
  },
];

const steps = [
  {
    number: 1,
    title: "Create a Project",
    description: "Set up environments like staging and production.",
  },
  {
    number: 2,
    title: "Define Flags",
    description: "Add feature flags with strategies and constraints.",
  },
  {
    number: 3,
    title: "Evaluate Anywhere",
    description: "Use the Go SDK or Client API to check flags at runtime.",
  },
];

const goCode = `client, _ := bandeira.New(bandeira.Config{
    URL:   "http://localhost:8080",
    Token: "your-token",
})
defer client.Close()

if client.IsEnabled("new-checkout", bandeira.Context{
    UserID: "42",
}) {
    // show new checkout
}`;

const curlCode = `curl http://localhost:8080/api/v1/flags \\
  -H "Authorization: Bearer <token>"`;

export default function Home() {
  const { auth } = usePage<SharedProps>().props;

  return (
    <PublicLayout overlay>
      <HeroGeometric
        badge="Open Source"
        title1="Feature Flags"
        title2="Made Simple"
        subtitle="Self-hosted feature flag management with per-environment toggles, gradual rollouts, and a Go SDK — deploy with Docker in 60 seconds."
        cta={{
          label: auth?.user ? "Go to Dashboard" : "View on GitHub",
          href: auth?.user ? "/dashboard" : "https://github.com/felipekafuri/bandeira",
        }}
      />

      {/* Features Grid */}
      <section className="relative py-24 px-4 md:px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 tracking-tight text-foreground">
            Everything you need to ship with confidence
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Bandeira gives you fine-grained control over feature rollouts with
            a self-hosted server and a local-evaluation SDK.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                    <feature.icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                {feature.href && (
                  <Link
                    href={feature.href}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-3"
                  >
                    Learn more <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-24 px-4 md:px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 tracking-tight text-foreground">
            How it works
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            Three steps from zero to feature flags in production.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
            {/* Dashed connector line (desktop only) */}
            <div className="hidden md:block absolute top-6 left-[20%] right-[20%] h-px border-t border-dashed border-border" />

            {steps.map((step) => (
              <div key={step.number} className="text-center relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-lg mb-4 relative z-10">
                  {step.number}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Snippet */}
      <section className="relative py-24 px-4 md:px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 tracking-tight text-foreground">
            Integrate in minutes
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Use the Go SDK for in-app evaluation or the REST API for scripts
            and automation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Go SDK
                </span>
              </div>
              <pre className="p-4 text-sm text-foreground/80 overflow-x-auto leading-relaxed bg-muted/30">
                <code>{goCode}</code>
              </pre>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  curl
                </span>
              </div>
              <pre className="p-4 text-sm text-foreground/80 overflow-x-auto leading-relaxed bg-muted/30">
                <code>{curlCode}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source CTA */}
      <section className="relative py-24 px-4 md:px-6 bg-background">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight text-foreground">
            Self-host in 60 seconds
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Bandeira is open source and runs anywhere Docker does. No cloud
            account, no vendor lock-in.
          </p>
          <div className="bg-card border border-border rounded-xl p-4 mb-8 inline-block shadow-sm">
            <code className="text-sm text-foreground font-mono">
              docker compose up -d
            </code>
          </div>
          <div className="flex items-center justify-center gap-3">
            <a
              href="https://github.com/felipekafuri/bandeira"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a
              href={auth?.user ? "/dashboard" : "https://github.com/felipekafuri/bandeira"}
              {...(!auth?.user && { target: "_blank", rel: "noopener noreferrer" })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              {auth?.user ? "Go to Dashboard" : "Get Started"}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center bg-background">
        <p className="text-xs text-muted-foreground">
          Bandeira — Open source feature flag management
        </p>
      </footer>
    </PublicLayout>
  );
}

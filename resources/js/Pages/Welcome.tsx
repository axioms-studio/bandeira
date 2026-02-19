import { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { SharedProps } from "@/types/global";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { FeatureFlagToggle } from "@/components/ui/feature-flag-toggle";
import { AnimateInView, AnimateChild } from "@/components/ui/animate-in-view";
import PublicLayout from "@/Layouts/PublicLayout";
import { motion } from "framer-motion";
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
    title: "Zero-Latency SDKs",
    description:
      "SDKs for Go, JS/TS, Python, PHP, Dart, and Elixir poll and cache locally — flag checks are pure in-memory lookups.",
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
    description: "Use any of our 6 SDKs to check flags at runtime.",
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

const jsCode = `const client = new BandeiraClient({
  url: "http://localhost:8080",
  token: "your-token",
});
await client.start();

if (client.isEnabled("new-checkout", {
  userId: "42",
})) {
  // show new checkout
}`;

const pyCode = `client = BandeiraClient(Config(
    url="http://localhost:8080",
    token="your-token",
))
client.start()

if client.is_enabled("new-checkout", Context(
    user_id="42",
)):
    # show new checkout`;

const phpCode = `$client = new Client(new Config(
    url: 'http://localhost:8080',
    token: 'your-token',
));

if ($client->isEnabled('new-checkout', new Context(
    userId: '42',
))) {
    // show new checkout
}`;

const dartCode = `final client = await BandeiraClient.create(
  const BandeiraConfig(
    url: "http://localhost:8080",
    token: "your-token",
  ),
);

if (client.isEnabled("new-checkout",
    const BandeiraContext(userId: "42"))) {
  // show new checkout
}`;

const elixirCode = `{:ok, client} =
  Client.start_link(%Config{
    url: "http://localhost:8080",
    token: "your-token"
  })

if Client.is_enabled(client, "new-checkout",
     %Context{user_id: "42"}) do
  # show new checkout
end`;

const curlCode = `curl http://localhost:8080/api/v1/flags \\
  -H "Authorization: Bearer <token>"`;

const sdkTabs = [
  { key: "go", label: "Go", code: goCode },
  { key: "js", label: "JavaScript", code: jsCode },
  { key: "py", label: "Python", code: pyCode },
  { key: "php", label: "PHP", code: phpCode },
  { key: "dart", label: "Dart", code: dartCode },
  { key: "elixir", label: "Elixir", code: elixirCode },
  { key: "curl", label: "curl", code: curlCode },
] as const;

function CodeTabs() {
  const [active, setActive] = useState<string>("go");
  const current = sdkTabs.find((t) => t.key === active)!;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-1">
        {sdkTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              active === tab.key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <pre className="p-4 text-sm text-foreground/80 overflow-x-auto leading-relaxed bg-muted/30">
        <code>{current.code}</code>
      </pre>
    </div>
  );
}

function ConnectorLine() {
  // In a 3-col grid, centers are at 16.67% and 83.33%.
  // We position the SVG to span between them.
  return (
    <svg
      className="hidden md:block absolute top-6 h-[2px] overflow-visible"
      style={{ left: "calc(100% / 6)", width: "calc(100% * 2 / 3)" }}
      preserveAspectRatio="none"
    >
      <motion.line
        x1="0"
        y1="1"
        x2="100%"
        y2="1"
        stroke="currentColor"
        className="text-border"
        strokeWidth={1}
        strokeDasharray="6 4"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
      />
    </svg>
  );
}

export default function Home() {
  const { auth } = usePage<SharedProps>().props;

  return (
    <PublicLayout overlay>
      <HeroGeometric
        badge="Open Source"
        title1="Feature Flags"
        title2="Made Simple"
        subtitle="Self-hosted feature flag management with per-environment toggles, gradual rollouts, and SDKs for Go, JS/TS, Python, PHP, Dart, and Elixir — deploy with Docker in 60 seconds."
        cta={{
          label: auth?.user ? "Go to Dashboard" : "View on GitHub",
          href: auth?.user ? "/dashboard" : "https://github.com/felipekafuri/bandeira",
        }}
      >
        <FeatureFlagToggle />
      </HeroGeometric>

      {/* Features Grid */}
      <AnimateInView
        as="section"
        preset="fade-up"
        staggerChildren={0.1}
        className="relative py-24 px-4 md:px-6 bg-background"
      >
        <div className="max-w-5xl mx-auto">
          <AnimateChild>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 tracking-tight text-foreground">
              Everything you need to ship with confidence
            </h2>
          </AnimateChild>
          <AnimateChild>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Bandeira gives you fine-grained control over feature rollouts with
              a self-hosted server and local-evaluation SDKs.
            </p>
          </AnimateChild>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature) => (
              <AnimateChild key={feature.title} className="h-full">
                <motion.div
                  whileHover={{ y: -2, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="h-full flex flex-col bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-[box-shadow,border-color]"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                      <feature.icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
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
                </motion.div>
              </AnimateChild>
            ))}
          </div>
        </div>
      </AnimateInView>

      {/* How It Works */}
      <AnimateInView
        as="section"
        preset="fade-up"
        staggerChildren={0.15}
        className="relative py-24 px-4 md:px-6 bg-background"
      >
        <div className="max-w-4xl mx-auto">
          <AnimateChild>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 tracking-tight text-foreground">
              How it works
            </h2>
          </AnimateChild>
          <AnimateChild>
            <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
              Three steps from zero to feature flags in production.
            </p>
          </AnimateChild>
          <AnimateChild>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
              <ConnectorLine />

              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.4 + i * 0.2,
                    ease: [0.25, 0.4, 0.25, 1],
                  }}
                  className="text-center relative"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-lg mb-4 relative z-10">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </AnimateChild>
        </div>
      </AnimateInView>

      {/* Code Snippet */}
      <AnimateInView
        as="section"
        preset="fade-up"
        staggerChildren={0.1}
        className="relative py-24 px-4 md:px-6 bg-background"
      >
        <div className="max-w-5xl mx-auto">
          <AnimateChild>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 tracking-tight text-foreground">
              Integrate in minutes
            </h2>
          </AnimateChild>
          <AnimateChild>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Pick your language — all SDKs evaluate flags locally with zero network
              latency. Or use the REST API for scripts and automation.
            </p>
          </AnimateChild>
          <CodeTabs />
        </div>
      </AnimateInView>

      {/* Open Source CTA */}
      <AnimateInView
        as="section"
        preset="scale-up"
        duration={0.7}
        className="relative py-24 px-4 md:px-6 bg-background"
      >
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
      </AnimateInView>

      {/* Footer */}
      <AnimateInView
        as="footer"
        preset="fade"
        duration={0.5}
        viewportAmount={0.5}
        className="border-t border-border py-8 px-4 bg-background"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Bandeira — Open source feature flag management
          </p>
          <Link
            href="/brand"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Brand
          </Link>
        </div>
      </AnimateInView>
    </PublicLayout>
  );
}

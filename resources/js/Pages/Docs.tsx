import { Link, useForm, usePage } from "@inertiajs/react";
import { SharedProps } from "@/types/global";
import {
  Flag,
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  LogOut,
  Terminal,
  Key,
  Rocket,
  Server,
  Shield,
  Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

export default function Docs() {
  const { auth } = usePage<SharedProps>().props;

  const { post, processing } = useForm({});
  const handleLogout = () => post("/user/logout");

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
              {auth?.user && (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/projects"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Projects
                  </Link>
                </>
              )}
              <Link
                href="/strategies"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Crosshair className="w-4 h-4" />
                Strategies
              </Link>
              <Link
                href="/docs"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-accent text-accent-foreground"
              >
                <BookOpen className="w-4 h-4" />
                Docs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {auth?.user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {auth.user.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </span>
                  </div>
                  <span>{auth.user.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={processing}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </>
            ) : (
              typeof window !== "undefined" &&
              !window.location.hostname.endsWith("bandeiras.app") && (
                <Link
                  href="/user/login"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              API Documentation
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Integrate Bandeira into your applications and CI/CD pipelines
            </p>
          </div>

          <div className="space-y-8">
            {/* Getting Started */}
            <section className="bg-card border border-border rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 bg-primary/10 rounded-lg">
                  <Rocket className="w-4.5 h-4.5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Getting Started
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Bandeira provides two integration paths:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
                <li>
                  <strong className="text-foreground">Go SDK</strong> — For
                  applications that need to evaluate feature flags at runtime
                  with local caching and strategy evaluation.
                </li>
                <li>
                  <strong className="text-foreground">Admin API</strong> — For
                  CI/CD pipelines, Terraform, scripts, and any automation that
                  manages projects, flags, environments, and tokens
                  programmatically.
                </li>
                <li>
                  <Link
                    href="/strategies"
                    className="text-primary hover:underline font-medium"
                  >
                    Strategy Documentation
                  </Link>{" "}
                  — Learn how targeting strategies and constraints work with an
                  interactive playground.
                </li>
              </ul>
            </section>

            {/* Go SDK */}
            <section className="bg-card border border-border rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 bg-accent rounded-lg">
                  <Terminal className="w-4.5 h-4.5 text-accent-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Go SDK
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Install the SDK in your Go application:
              </p>
              <CodeBlock>go get github.com/felipekafuri/bandeira-go</CodeBlock>

              <p className="text-sm text-muted-foreground mt-4 mb-2">
                Quick start:
              </p>
              <CodeBlock>
                {`import bandeira "github.com/felipekafuri/bandeira-go"

client, err := bandeira.New(bandeira.Config{
    URL:   "http://localhost:8080",
    Token: "your-client-token",
})
if err != nil {
    log.Fatal(err)
}
defer client.Close()

// Simple boolean check
if client.IsEnabled("new-dashboard") {
    // show new dashboard
}

// With context for strategy evaluation
if client.IsEnabled("premium-feature", bandeira.Context{
    UserID: "42",
    Properties: map[string]string{
        "plan": "enterprise",
    },
}) {
    // show premium feature
}`}
              </CodeBlock>
              <p className="text-sm text-muted-foreground mt-4">
                The client polls the server every 15 seconds (configurable) and
                caches flags locally. IsEnabled() calls are pure in-memory
                lookups with zero network latency. See the full documentation at{" "}
                <a
                  href="https://github.com/felipekafuri/bandeira-go"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  github.com/felipekafuri/bandeira-go
                </a>
                .
              </p>
            </section>

            {/* Authentication */}
            <section className="bg-card border border-border rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 bg-primary/10 rounded-lg">
                  <Shield className="w-4.5 h-4.5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Authentication
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Bandeira uses Bearer tokens for API authentication. There are
                two token types:
              </p>
              <div className="space-y-3">
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Client tokens
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Scoped to a specific project + environment. Used by the Go
                    SDK and the Client API to read flag state. Create these in
                    the dashboard under Project {">"} API Tokens.
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Admin tokens
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Scoped to a specific project. Used by the Admin API to
                    manage resources (environments, flags, tokens). Create these
                    in the dashboard under Project {">"} API Tokens with
                    type "admin".
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Pass the token in the <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-xs">Authorization</code> header:
              </p>
              <CodeBlock>Authorization: Bearer your-token-here</CodeBlock>
            </section>

            {/* Client API */}
            <section className="bg-card border border-border rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 bg-accent rounded-lg">
                  <Server className="w-4.5 h-4.5 text-accent-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Client API
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                The Client API returns all flags for the token's environment,
                including strategies and constraints for local evaluation.
              </p>

              <h3 className="text-sm font-semibold text-foreground mb-2">
                GET /api/v1/flags
              </h3>
              <CodeBlock>
                {`curl -s http://localhost:8080/api/v1/flags \\
  -H "Authorization: Bearer <client-token>"`}
              </CodeBlock>
              <p className="text-sm text-muted-foreground mt-2 mb-2">
                Response:
              </p>
              <CodeBlock>
                {`{
  "flags": [
    {
      "name": "new-dashboard",
      "enabled": true,
      "strategies": [
        {
          "name": "default",
          "parameters": {},
          "constraints": []
        }
      ]
    },
    {
      "name": "premium-feature",
      "enabled": true,
      "strategies": [
        {
          "name": "userWithId",
          "parameters": { "userIds": "1,42,100" },
          "constraints": [
            {
              "context_name": "plan",
              "operator": "IN",
              "values": ["enterprise", "pro"],
              "inverted": false,
              "case_insensitive": false
            }
          ]
        }
      ]
    }
  ]
}`}
              </CodeBlock>
            </section>

            {/* Admin API */}
            <section className="bg-card border border-border rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 bg-primary/10 rounded-lg">
                  <Key className="w-4.5 h-4.5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Admin API
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                The Admin API lets you manage your project's resources
                programmatically. All endpoints require an admin token and are
                scoped to the token's project.
              </p>

              {/* Projects */}
              <h3 className="text-sm font-semibold text-foreground mb-3 mt-6 border-b border-border pb-2">
                Projects
              </h3>
              <div className="space-y-1 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-green-600">GET</code>
                  <code>/api/v1/admin/projects</code>
                  <span className="text-xs">— List projects</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-green-600">GET</code>
                  <code>/api/v1/admin/projects/:id</code>
                  <span className="text-xs">— Get project details</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-blue-600">PUT</code>
                  <code>/api/v1/admin/projects/:id</code>
                  <span className="text-xs">— Update project</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-red-600">DELETE</code>
                  <code>/api/v1/admin/projects/:id</code>
                  <span className="text-xs">— Delete project</span>
                </div>
              </div>

              {/* Environments */}
              <h3 className="text-sm font-semibold text-foreground mb-3 mt-6 border-b border-border pb-2">
                Environments
              </h3>
              <div className="space-y-1 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-green-600">GET</code>
                  <code>/api/v1/admin/projects/:id/environments</code>
                  <span className="text-xs">— List environments</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-yellow-600">POST</code>
                  <code>/api/v1/admin/projects/:id/environments</code>
                  <span className="text-xs">— Create environment</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-blue-600">PUT</code>
                  <code>/api/v1/admin/projects/:id/environments/:envId</code>
                  <span className="text-xs">— Update environment</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-red-600">DELETE</code>
                  <code>/api/v1/admin/projects/:id/environments/:envId</code>
                  <span className="text-xs">— Delete environment</span>
                </div>
              </div>

              {/* Flags */}
              <h3 className="text-sm font-semibold text-foreground mb-3 mt-6 border-b border-border pb-2">
                Flags
              </h3>
              <div className="space-y-1 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-green-600">GET</code>
                  <code>/api/v1/admin/projects/:id/flags</code>
                  <span className="text-xs">— List flags</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-yellow-600">POST</code>
                  <code>/api/v1/admin/projects/:id/flags</code>
                  <span className="text-xs">— Create flag</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-green-600">GET</code>
                  <code>/api/v1/admin/projects/:id/flags/:flagId</code>
                  <span className="text-xs">— Get flag with strategies</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-blue-600">PUT</code>
                  <code>/api/v1/admin/projects/:id/flags/:flagId</code>
                  <span className="text-xs">— Update flag</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-red-600">DELETE</code>
                  <code>/api/v1/admin/projects/:id/flags/:flagId</code>
                  <span className="text-xs">— Delete flag</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-purple-600">PATCH</code>
                  <code>/api/v1/admin/projects/:id/flags/:flagId/environments/:envId</code>
                  <span className="text-xs">— Toggle flag / set strategies</span>
                </div>
              </div>

              {/* Tokens */}
              <h3 className="text-sm font-semibold text-foreground mb-3 mt-6 border-b border-border pb-2">
                API Tokens
              </h3>
              <div className="space-y-1 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-green-600">GET</code>
                  <code>/api/v1/admin/api-tokens</code>
                  <span className="text-xs">— List tokens</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-yellow-600">POST</code>
                  <code>/api/v1/admin/api-tokens</code>
                  <span className="text-xs">— Create token</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-red-600">DELETE</code>
                  <code>/api/v1/admin/api-tokens/:id</code>
                  <span className="text-xs">— Delete token</span>
                </div>
              </div>

              {/* Examples */}
              <h3 className="text-sm font-semibold text-foreground mb-3 mt-6 border-b border-border pb-2">
                Examples
              </h3>

              <p className="text-sm text-muted-foreground mb-2">
                Create a feature flag:
              </p>
              <CodeBlock>
                {`curl -X POST http://localhost:8080/api/v1/admin/projects/1/flags \\
  -H "Authorization: Bearer <admin-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "new-checkout", "flag_type": "release"}'`}
              </CodeBlock>

              <p className="text-sm text-muted-foreground mt-4 mb-2">
                Enable a flag in an environment:
              </p>
              <CodeBlock>
                {`curl -X PATCH http://localhost:8080/api/v1/admin/projects/1/flags/3/environments/2 \\
  -H "Authorization: Bearer <admin-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"enabled": true}'`}
              </CodeBlock>

              <p className="text-sm text-muted-foreground mt-4 mb-2">
                Create an admin token:
              </p>
              <CodeBlock>
                {`curl -X POST http://localhost:8080/api/v1/admin/api-tokens \\
  -H "Authorization: Bearer <admin-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "ci-token", "token_type": "admin"}'`}
              </CodeBlock>
            </section>

            {/* CI/CD */}
            <section className="bg-card border border-border rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 bg-accent rounded-lg">
                  <Rocket className="w-4.5 h-4.5 text-accent-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Terraform / CI/CD
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Use the Admin API in your deployment pipeline to manage flags as
                code. Here's an example shell script for a CI job:
              </p>
              <CodeBlock>
                {`#!/bin/bash
# deploy.sh — enable a feature flag after deployment
set -euo pipefail

BANDEIRA_URL="https://bandeira.example.com"
ADMIN_TOKEN="\${BANDEIRA_ADMIN_TOKEN}"
PROJECT_ID="1"
FLAG_ID="3"
ENV_ID="2"  # production

# Enable the flag in production
curl -sf -X PATCH "\${BANDEIRA_URL}/api/v1/admin/projects/\${PROJECT_ID}/flags/\${FLAG_ID}/environments/\${ENV_ID}" \\
  -H "Authorization: Bearer \${ADMIN_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{"enabled": true}'

echo "Flag enabled in production"`}
              </CodeBlock>
              <p className="text-sm text-muted-foreground mt-4">
                You can also use the Admin API to create flags and environments
                as part of your infrastructure-as-code setup, or integrate with
                Terraform using the <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-xs">external</code> data
                source to call the API.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

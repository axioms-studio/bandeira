import { Link } from "@inertiajs/react";
import {
  Terminal,
  Key,
  Rocket,
  Server,
  Shield,
} from "lucide-react";
import PublicLayout from "@/Layouts/PublicLayout";

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-muted rounded-lg p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm leading-relaxed max-w-full">
      <code>{children}</code>
    </pre>
  );
}

const methodColors: Record<string, string> = {
  GET: "text-green-600",
  POST: "text-yellow-600",
  PUT: "text-blue-600",
  PATCH: "text-purple-600",
  DELETE: "text-red-600",
};

function Endpoint({
  method,
  path,
  description,
}: {
  method: string;
  path: string;
  description: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-muted-foreground py-1 min-w-0">
      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
        <code
          className={`bg-muted px-1.5 py-0.5 rounded text-xs font-semibold shrink-0 ${methodColors[method] ?? ""}`}
        >
          {method}
        </code>
        <code className="text-xs sm:text-sm truncate min-w-0">{path}</code>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {description}
      </span>
    </div>
  );
}

export default function Docs() {
  return (
    <PublicLayout activePage="docs">
      <div className="py-8 px-4 md:px-6">
        <div className="mx-auto max-w-4xl">
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
            <section className="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6">
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
            <section className="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6">
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
            <section className="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6">
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
                <div className="bg-muted rounded-lg p-3 sm:p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Client tokens
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Scoped to a specific project + environment. Used by the Go
                    SDK and the Client API to read flag state. Create these in
                    the dashboard under Project {">"} API Tokens.
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-3 sm:p-4">
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
            <section className="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6">
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
            <section className="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6">
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
              <div className="space-y-0.5 text-sm mb-4">
                <Endpoint method="GET" path="/api/v1/admin/projects" description="— List projects" />
                <Endpoint method="GET" path="/api/v1/admin/projects/:id" description="— Get project details" />
                <Endpoint method="PUT" path="/api/v1/admin/projects/:id" description="— Update project" />
                <Endpoint method="DELETE" path="/api/v1/admin/projects/:id" description="— Delete project" />
              </div>

              {/* Environments */}
              <h3 className="text-sm font-semibold text-foreground mb-3 mt-6 border-b border-border pb-2">
                Environments
              </h3>
              <div className="space-y-0.5 text-sm mb-4">
                <Endpoint method="GET" path="/api/v1/admin/projects/:id/environments" description="— List environments" />
                <Endpoint method="POST" path="/api/v1/admin/projects/:id/environments" description="— Create environment" />
                <Endpoint method="PUT" path="/api/v1/admin/projects/:id/environments/:envId" description="— Update environment" />
                <Endpoint method="DELETE" path="/api/v1/admin/projects/:id/environments/:envId" description="— Delete environment" />
              </div>

              {/* Flags */}
              <h3 className="text-sm font-semibold text-foreground mb-3 mt-6 border-b border-border pb-2">
                Flags
              </h3>
              <div className="space-y-0.5 text-sm mb-4">
                <Endpoint method="GET" path="/api/v1/admin/projects/:id/flags" description="— List flags" />
                <Endpoint method="POST" path="/api/v1/admin/projects/:id/flags" description="— Create flag" />
                <Endpoint method="GET" path="/api/v1/admin/projects/:id/flags/:flagId" description="— Get flag with strategies" />
                <Endpoint method="PUT" path="/api/v1/admin/projects/:id/flags/:flagId" description="— Update flag" />
                <Endpoint method="DELETE" path="/api/v1/admin/projects/:id/flags/:flagId" description="— Delete flag" />
                <Endpoint method="PATCH" path="/api/v1/admin/projects/:id/flags/:flagId/environments/:envId" description="— Toggle flag / set strategies" />
              </div>

              {/* Tokens */}
              <h3 className="text-sm font-semibold text-foreground mb-3 mt-6 border-b border-border pb-2">
                API Tokens
              </h3>
              <div className="space-y-0.5 text-sm mb-4">
                <Endpoint method="GET" path="/api/v1/admin/api-tokens" description="— List tokens" />
                <Endpoint method="POST" path="/api/v1/admin/api-tokens" description="— Create token" />
                <Endpoint method="DELETE" path="/api/v1/admin/api-tokens/:id" description="— Delete token" />
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
            <section className="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6">
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
      </div>
    </PublicLayout>
  );
}

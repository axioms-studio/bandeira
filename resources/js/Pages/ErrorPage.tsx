import { Head, Link } from "@inertiajs/react";

interface ErrorPageProps {
  status: number;
  message?: string;
}

const defaultMessages: Record<number, string> = {
  403: "forbidden",
  404: "not_found",
  419: "page_expired",
  429: "too_many_requests",
  500: "server_error",
};

export default function ErrorPage({ status, message }: ErrorPageProps) {
  const title = message || defaultMessages[status] || "something went wrong";

  return (
    <>
      <Head title={`${status} ${title}`} />
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground text-center px-6">
        <p className="text-lg text-muted-foreground mb-4">
          {">"} error {status}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
          # {title}
        </h1>
        <Link
          href="/"
          className="mt-6 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          [go_home]
        </Link>
      </div>
    </>
  );
}

import { useForm, Link } from "@inertiajs/react";
import { FormEventHandler, useRef, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SharedProps } from "@/types/global";
import { usePage } from "@inertiajs/react";
import { useFlashToasts } from "@/hooks/useFlashToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InputError from "@/components/InputError";
import { Flag, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";

export default function Login() {
  const { flash } = usePage<SharedProps>().props;
  const errors = usePage().props.errors as Record<string, string[]> | undefined;
  useFlashToasts(flash);

  const passwordRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { data, setData, post, processing } = useForm({
    password: "",
  });

  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  // Clear password and re-focus on validation error
  useEffect(() => {
    if (errors?.Password) {
      setData("password", "");
      passwordRef.current?.focus();
    }
  }, [errors]);

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post("/user/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
            <Flag className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
            Bandeira
          </span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Logo & heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-6">
              <Flag className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Enter your admin password to continue
            </p>
          </div>

          {/* Form card */}
          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={data.password}
                    onChange={(e) => setData("password", e.target.value)}
                    aria-invalid={!!errors?.Password}
                    className="pr-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors?.Password?.map((msg, i) => (
                  <InputError key={i} message={msg} />
                ))}
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </div>

          {/* Footer link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link
              href="/"
              className="hover:text-foreground transition-colors underline underline-offset-4"
            >
              Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

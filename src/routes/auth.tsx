import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search["mode"] === "signup" ? ("signup" as const) : ("login" as const),
  }),
  head: () => ({
    meta: [
      { title: "Sign in — StudyMate" },
      {
        name: "description",
        content: "Log in or create your StudyMate account to manage your timetable and study plan.",
      },
      { property: "og:title", content: "Sign in — StudyMate" },
      { property: "og:description", content: "Access your student timetable and study planner." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72),
  fullName: z.string().trim().max(80).optional(),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/dashboard", replace: true });
  }, [authLoading, user, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse({ email, password, fullName });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: parsed.data.fullName || parsed.data.email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setEmailSent(true);
          toast.success("Check your email to confirm your account");
        } else {
          toast.success("Welcome to StudyMate");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const google = async () => {
    setSubmitting(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setSubmitting(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <div className="hero-glow hidden flex-1 flex-col justify-between p-12 lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold">StudyMate</span>
        </Link>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            One workspace for your whole semester.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Timetable, subjects, tasks, deadlines, notes and progress — always in sync, always
            private to you.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">Made for college students.</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-display text-lg font-semibold">StudyMate</span>
          </Link>

          <h1 className="text-2xl font-semibold">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isSignup
              ? "Start planning your semester in under a minute."
              : "Log in to continue where you left off."}
          </p>

          {emailSent ? (
            <div className="surface mt-6 p-5 text-sm">
              <p className="font-medium">Confirm your email</p>
              <p className="mt-1 text-muted-foreground">
                We sent a confirmation link to {email}. Click it to activate your account, then come
                back and log in.
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => {
                  setEmailSent(false);
                  navigate({ to: "/auth", search: { mode: "login" } });
                }}
              >
                Back to login
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                {isSignup && (
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Aditi Sharma"
                      maxLength={80}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    autoComplete="email"
                  />
                  {errors["email"] && (
                    <p className="text-xs text-destructive">{errors["email"]}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={isSignup ? "new-password" : "current-password"}
                  />
                  {errors["password"] && (
                    <p className="text-xs text-destructive">{errors["password"]}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {isSignup ? "Create account" : "Log in"}
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={google}
                disabled={submitting}
              >
                Continue with Google
              </Button>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {isSignup ? "Already have an account?" : "New to StudyMate?"}{" "}
                <Link
                  to="/auth"
                  search={{ mode: isSignup ? "login" : "signup" }}
                  className="font-medium text-primary hover:underline"
                >
                  {isSignup ? "Log in" : "Create one"}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

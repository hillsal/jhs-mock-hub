import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "School Login | Hills Examination Board" },
      {
        name: "description",
        content:
          "Log in to your Hills Examination Board school account to view your membership, orders and BECE mock predictions.",
      },
      { property: "og:title", content: "School Login | Hills Examination Board" },
      {
        property: "og:description",
        content: "Access your JHS school dashboard, payments and prediction downloads.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset link sent. Please check your email.");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/30 px-4 py-14">
        <div className="mx-auto w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">School Account</CardTitle>
              <CardDescription>
                Log in to access your membership, orders and predictions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="forgot">Forgot password</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">School email</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={255}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in…" : "Login"}
                    </Button>
                  </form>
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    No account yet?{" "}
                    <Link to="/register" className="font-medium text-primary hover:underline">
                      Register your school
                    </Link>
                  </p>
                </TabsContent>

                <TabsContent value="forgot">
                  <form onSubmit={handleReset} className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">School email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        required
                        maxLength={255}
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Sending…" : "Send reset link"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

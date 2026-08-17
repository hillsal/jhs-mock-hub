import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FileText, ShieldCheck, GraduationCap } from "lucide-react";

import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hills Educational Consult | JHS Mock & BECE Predictions" },
      {
        name: "description",
        content:
          "Hills Examination Board supports Ghanaian JHS schools with mock examinations and BECE prediction packages. Register your school and buy predictions online.",
      },
      { property: "og:title", content: "Hills Educational Consult | JHS Mock & BECE Predictions" },
      {
        property: "og:description",
        content:
          "Hills Examination Board supports Ghanaian JHS schools with mock examinations and BECE prediction packages. Register your school and buy predictions online.",
      },
    ],
  }),
  component: Home,
});

const STEPS = [
  "Register your school",
  "Choose candidates & mock type",
  "Select a prediction package",
  "Pay online securely",
  "Download your prediction",
];

function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="heb-gradient">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-2 lg:items-center">
            <div className="text-primary-foreground">
              <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                Hills Examination Board
              </span>
              <h1 className="mt-5 text-3xl font-bold leading-tight md:text-5xl">
                JHS School Membership &amp; BECE Mock Predictions
              </h1>
              <p className="mt-4 max-w-xl text-base opacity-90">
                Register your Junior High School, select your mock candidates, choose a
                prediction package and pay online. Your prediction is unlocked the moment
                payment is confirmed.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/register">Start JHS Registration</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Link to="/membership">How it works</Link>
                </Button>
              </div>
            </div>
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <h2 className="font-serif text-lg font-bold">Membership in 5 steps</h2>
                <ol className="mt-4 space-y-3">
                  {STEPS.map((step, i) => (
                    <li key={step} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                        {i + 1}
                      </span>
                      <span className="text-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            Built for Ghanaian JHS schools
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: GraduationCap,
                title: "School membership",
                body: "Every registered school receives a unique Hills Examination Board membership number and a private dashboard.",
              },
              {
                icon: FileText,
                title: "Prediction packages",
                body: "Full BECE prediction across all subjects, or focused core-subject packages priced per candidate.",
              },
              {
                icon: ShieldCheck,
                title: "Secure access",
                body: "Predictions are released only after payment is verified. Files are never exposed on public links.",
              },
            ].map((f) => (
              <Card key={f.title}>
                <CardContent className="p-6">
                  <f.icon className="size-8 text-primary" />
                  <h3 className="mt-4 text-base font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-14 text-center">
            <h2 className="text-2xl font-bold">Ready to register your school?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
              Registration takes a few minutes. You will need your school details, your mock
              coordinator&apos;s contact and the number of candidates sitting the mock.
            </p>
            <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["No paperwork", "Instant membership ID", "Pay with Paystack"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" /> {t}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8">
              <Link to="/register">Begin registration</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck } from "lucide-react";

import { registerMemberFn } from "@/lib/member.functions";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GHANA_REGIONS, SCHOOL_TYPES } from "@/lib/ghana";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Member Registration | Hills Examination Board" },
      {
        name: "description",
        content:
          "Register once for Hills Examination Board membership and receive a permanent Serial Number and PIN for buying mocks, predictions and provisions.",
      },
      { property: "og:title", content: "Member Registration — Hills Examination Board" },
      {
        property: "og:description",
        content: "One general membership registration. Register once, buy many times.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

const CURRENT_YEAR = new Date().getFullYear();
const ACADEMIC_YEARS = [
  `${CURRENT_YEAR}`,
  `${CURRENT_YEAR}/${CURRENT_YEAR + 1}`,
  `${CURRENT_YEAR + 1}`,
];

type Credentials = { membershipId: string; pin: string; memberName: string };

function RegisterPage() {
  const register = useServerFn(registerMemberFn);
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [form, setForm] = useState({
    organizationName: "",
    contactPerson: "",
    phone: "",
    whatsapp: "",
    email: "",
    region: "",
    district: "",
    address: "",
    schoolType: "Private JHS",
    candidates: "",
    students: "",
    academicYear: ACADEMIC_YEARS[1] ?? `${CURRENT_YEAR}`,
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await register({
        data: {
          ...form,
          candidates: Number(form.candidates || 0),
          students: Number(form.students || 0),
        },
      });
      setCredentials(result);
      toast.success("Registration successful");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/30 py-12">
        <div className="mx-auto max-w-3xl px-4">
          {credentials ? (
            <Card className="border-primary/40">
              <CardHeader className="text-center">
                <CheckCircle2 className="mx-auto size-10 text-primary" />
                <CardTitle className="font-serif text-2xl">Registration successful</CardTitle>
                <CardDescription>{credentials.memberName} is now an active member.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-card p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Serial Number
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold text-primary">
                      {credentials.membershipId}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      PIN
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold tracking-[0.35em] text-primary">
                      {credentials.pin}
                    </p>
                  </div>
                </div>
                <p className="rounded-md bg-secondary p-4 text-sm">
                  Keep your Serial Number and PIN safe. You will use them whenever you want to
                  purchase products or access your membership services. This PIN is shown only once
                  — write it down now.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button asChild>
                    <Link to="/member">Go to my account</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/buy/prediction">Buy a prediction</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-secondary">
                  <ShieldCheck className="size-5 text-primary" />
                </div>
                <CardTitle className="font-serif text-2xl">Member Registration</CardTitle>
                <CardDescription>
                  One general registration for the whole platform. After registering you receive a
                  permanent Serial Number and PIN — use them to buy mocks, predictions, provisions
                  and other services without registering again.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="org">School / Organization name</Label>
                    <Input
                      id="org"
                      value={form.organizationName}
                      onChange={(e) => set("organizationName")(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact person</Label>
                      <Input
                        id="contact"
                        value={form.contactPerson}
                        onChange={(e) => set("contactPerson")(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Organization type</Label>
                      <Select value={form.schoolType} onValueChange={set("schoolType")}>
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHOOL_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                          <SelectItem value="Other organization">Other organization</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => set("phone")(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp number (optional)</Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        value={form.whatsapp}
                        onChange={(e) => set("whatsapp")(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email")(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Select value={form.region} onValueChange={set("region")}>
                        <SelectTrigger id="region">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {GHANA_REGIONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">District</Label>
                      <Input
                        id="district"
                        value={form.district}
                        onChange={(e) => set("district")(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Location / postal address</Label>
                    <Textarea
                      id="address"
                      rows={2}
                      value={form.address}
                      onChange={(e) => set("address")(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="candidates">Number of candidates</Label>
                      <Input
                        id="candidates"
                        type="number"
                        min={0}
                        value={form.candidates}
                        onChange={(e) => set("candidates")(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="students">Total students</Label>
                      <Input
                        id="students"
                        type="number"
                        min={0}
                        value={form.students}
                        onChange={(e) => set("students")(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Academic year</Label>
                      <Select value={form.academicYear} onValueChange={set("academicYear")}>
                        <SelectTrigger id="year">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACADEMIC_YEARS.map((y) => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={busy}>
                    {busy ? "Creating membership…" : "Complete registration"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Already registered?{" "}
                    <Link to="/member" className="font-medium text-primary hover:underline">
                      Sign in with your Serial Number and PIN
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

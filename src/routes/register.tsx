import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { createOrder } from "@/lib/membership.functions";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { CANDIDATE_OPTIONS, GHANA_REGIONS, SCHOOL_TYPES, formatGhs } from "@/lib/ghana";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "JHS Membership Registration | Hills Examination Board" },
      {
        name: "description",
        content:
          "Register your Junior High School with the Hills Examination Board, select mock candidates and buy a BECE prediction package online.",
      },
      { property: "og:title", content: "JHS Membership Registration" },
      {
        property: "og:description",
        content:
          "Register your JHS, choose your mock and prediction package, and pay securely online.",
      },
    ],
  }),
  component: RegisterPage,
});

const STEP_LABELS = [
  "School Information",
  "Students & Candidates",
  "Select Mock",
  "Select Prediction",
  "Order Summary",
  "Payment",
];

type Form = {
  school_name: string;
  school_type: string;
  region: string;
  district: string;
  school_address: string;
  school_phone: string;
  school_email: string;
  whatsapp_number: string;
  contact_person: string;
  head_teacher_name: string;
  coordinator_name: string;
  coordinator_phone: string;
  coordinator_whatsapp: string;
  coordinator_email: string;
};

const EMPTY: Form = {
  school_name: "",
  school_type: "",
  region: "",
  district: "",
  school_address: "",
  school_phone: "",
  school_email: "",
  whatsapp_number: "",
  contact_person: "",
  head_teacher_name: "",
  coordinator_name: "",
  coordinator_phone: "",
  coordinator_whatsapp: "",
  coordinator_email: "",
};

function Progress({ step }: { step: number }) {
  return (
    <ol className="mb-8 flex flex-wrap gap-2">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <li
            key={label}
            className={`flex flex-1 min-w-[130px] items-center gap-2 rounded-md border px-3 py-2 text-xs ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : done
                  ? "border-primary/40 bg-secondary text-secondary-foreground"
                  : "border-border bg-card text-muted-foreground"
            }`}
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-bold">
              {done ? <Check className="size-3" /> : n}
            </span>
            <span className="font-medium">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(EMPTY);
  const [totalStudents, setTotalStudents] = useState("");
  const [candidateChoice, setCandidateChoice] = useState("");
  const [customCandidates, setCustomCandidates] = useState("");
  const [mockTypeId, setMockTypeId] = useState("");
  const [productId, setProductId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data: catalogue } = useQuery({
    queryKey: ["catalogue"],
    queryFn: async () => {
      const [{ data: mocks, error: e1 }, { data: products, error: e2 }] = await Promise.all([
        supabase.from("mock_types").select("*").eq("is_active", true).order("sort_order"),
        supabase
          .from("prediction_products")
          .select("*")
          .eq("is_active", true)
          .order("sort_order"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { mocks: mocks ?? [], products: products ?? [] };
    },
  });

  const candidates =
    candidateChoice === "other" ? Number(customCandidates || 0) : Number(candidateChoice || 0);
  const students = Number(totalStudents || 0);
  const candidateError =
    candidates > 0 && students > 0 && candidates > students
      ? "The number of mock candidates cannot exceed the total number of JHS students."
      : "";

  const products = useMemo(
    () => (catalogue?.products ?? []).filter((p) => p.mock_type_id === mockTypeId),
    [catalogue, mockTypeId],
  );
  const product = products.find((p) => p.id === productId);
  const mock = catalogue?.mocks.find((m) => m.id === mockTypeId);
  const perCandidate = product?.pricing_mode === "per_candidate";
  const packageTotal = product
    ? Number(product.price_per_candidate) * (perCandidate ? candidates : 1)
    : 0;
  const total = product ? packageTotal + 200 : 0;

  function next() {
    if (step === 1) {
      const required: (keyof Form)[] = [
        "school_name",
        "school_type",
        "region",
        "district",
        "school_phone",
        "school_email",
      ];
      const missing = required.find((k) => !form[k].trim());
      if (missing) {
        toast.error("Please complete all required school fields.");
        return;
      }
    }
    if (step === 2) {
      if (!students || students < 1) {
        toast.error("Enter the total number of JHS students.");
        return;
      }
      if (!candidates || candidates < 1) {
        toast.error("Select the number of mock candidates.");
        return;
      }
      if (candidateError) {
        toast.error(candidateError);
        return;
      }
    }
    if (step === 3 && !mockTypeId) {
      toast.error("Select a mock examination.");
      return;
    }
    if (step === 4 && !productId) {
      toast.error("Select a prediction package.");
      return;
    }
    setStep((s) => Math.min(s + 1, 6));
  }

  async function handleSubmit() {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.school_email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signUpError) throw signUpError;
      if (!signUpData.session) {
        toast.success("Account created. Please confirm your email, then log in to continue.");
        navigate({ to: "/auth" });
        return;
      }

      const userId = signUpData.session.user.id;
      const { error: schoolError } = await supabase.from("schools").insert({
        user_id: userId,
        school_name: form.school_name.trim(),
        school_type: form.school_type,
        region: form.region,
        district: form.district.trim(),
        school_address: form.school_address.trim() || null,
        school_phone: form.school_phone.trim(),
        school_email: form.school_email.trim(),
        whatsapp_number: form.whatsapp_number.trim() || null,
        contact_person: form.contact_person.trim() || null,
        head_teacher_name: form.head_teacher_name.trim() || null,
        coordinator_name: form.coordinator_name.trim() || null,
        coordinator_phone: form.coordinator_phone.trim() || null,
        coordinator_whatsapp: form.coordinator_whatsapp.trim() || null,
        coordinator_email: form.coordinator_email.trim() || null,
        total_jhs_students: students,
        mock_candidates: candidates,
      });
      if (schoolError) throw schoolError;

      const order = await createOrder({ data: { productId, candidateCount: candidates } });
      setOrderNumber(order.order_number);
      setStep(6);
      toast.success("Registration complete. Your order is ready for payment.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/30 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-center font-serif text-2xl font-bold md:text-3xl">
            JHS Membership Registration
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Complete each step to register your school and order your mock prediction.
          </p>

          <div className="mt-8">
            <Progress step={step} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">
                Step {step} — {STEP_LABELS[step - 1]}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Tell us about your school and your mock coordinator."}
                {step === 2 && "Enter your JHS population and how many candidates will sit."}
                {step === 3 && "Choose the mock examination you are preparing for."}
                {step === 4 && "Choose the prediction package you would like to buy."}
                {step === 5 && "Review your order and create your school account."}
                {step === 6 && "Your order has been created."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="School name *" className="sm:col-span-2">
                    <Input
                      maxLength={150}
                      value={form.school_name}
                      onChange={(e) => set("school_name")(e.target.value)}
                    />
                  </Field>
                  <Field label="School type *">
                    <Select value={form.school_type} onValueChange={set("school_type")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOOL_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Region *">
                    <Select value={form.region} onValueChange={set("region")}>
                      <SelectTrigger>
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
                  </Field>
                  <Field label="District / Municipality *">
                    <Input
                      maxLength={120}
                      value={form.district}
                      onChange={(e) => set("district")(e.target.value)}
                    />
                  </Field>
                  <Field label="School phone *">
                    <Input
                      maxLength={30}
                      value={form.school_phone}
                      onChange={(e) => set("school_phone")(e.target.value)}
                    />
                  </Field>
                  <Field label="School email * (used to log in)" className="sm:col-span-2">
                    <Input
                      type="email"
                      maxLength={255}
                      value={form.school_email}
                      onChange={(e) => set("school_email")(e.target.value)}
                    />
                  </Field>
                  <Field label="WhatsApp number">
                    <Input
                      maxLength={30}
                      value={form.whatsapp_number}
                      onChange={(e) => set("whatsapp_number")(e.target.value)}
                    />
                  </Field>
                  <Field label="School contact person">
                    <Input
                      maxLength={120}
                      value={form.contact_person}
                      onChange={(e) => set("contact_person")(e.target.value)}
                    />
                  </Field>
                  <Field label="School address" className="sm:col-span-2">
                    <Textarea
                      maxLength={300}
                      value={form.school_address}
                      onChange={(e) => set("school_address")(e.target.value)}
                    />
                  </Field>
                  <Field label="Headteacher name" className="sm:col-span-2">
                    <Input
                      maxLength={120}
                      value={form.head_teacher_name}
                      onChange={(e) => set("head_teacher_name")(e.target.value)}
                    />
                  </Field>
                  <Field label="Mock coordinator name">
                    <Input
                      maxLength={120}
                      value={form.coordinator_name}
                      onChange={(e) => set("coordinator_name")(e.target.value)}
                    />
                  </Field>
                  <Field label="Coordinator phone">
                    <Input
                      maxLength={30}
                      value={form.coordinator_phone}
                      onChange={(e) => set("coordinator_phone")(e.target.value)}
                    />
                  </Field>
                  <Field label="Coordinator WhatsApp">
                    <Input
                      maxLength={30}
                      value={form.coordinator_whatsapp}
                      onChange={(e) => set("coordinator_whatsapp")(e.target.value)}
                    />
                  </Field>
                  <Field label="Coordinator email">
                    <Input
                      type="email"
                      maxLength={255}
                      value={form.coordinator_email}
                      onChange={(e) => set("coordinator_email")(e.target.value)}
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Total number of JHS students *">
                    <Input
                      type="number"
                      min={1}
                      max={100000}
                      value={totalStudents}
                      onChange={(e) => setTotalStudents(e.target.value)}
                    />
                  </Field>
                  <Field label="Select number of mock candidates *">
                    <Select value={candidateChoice} onValueChange={setCandidateChoice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select candidates" />
                      </SelectTrigger>
                      <SelectContent>
                        {CANDIDATE_OPTIONS.map((c) => (
                          <SelectItem key={c} value={String(c)}>
                            {c}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  {candidateChoice === "other" && (
                    <Field label="Enter number of candidates *">
                      <Input
                        type="number"
                        min={1}
                        max={100000}
                        value={customCandidates}
                        onChange={(e) => setCustomCandidates(e.target.value)}
                      />
                    </Field>
                  )}
                  {candidateError && (
                    <p className="text-sm font-medium text-destructive sm:col-span-2">
                      {candidateError}
                    </p>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-3">
                  {catalogue?.mocks.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setMockTypeId(m.id);
                        setProductId("");
                      }}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        mockTypeId === m.id
                          ? "border-primary bg-secondary"
                          : "border-border hover:bg-secondary/60"
                      }`}
                    >
                      <p className="font-semibold">{m.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                    </button>
                  ))}
                </div>
              )}

              {step === 4 && (
                <div className="grid gap-3">
                  {products.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No prediction packages are currently available for this mock. Please
                      contact the Board.
                    </p>
                  )}
                  {products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProductId(p.id)}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        productId === p.id
                          ? "border-primary bg-secondary"
                          : "border-border hover:bg-secondary/60"
                      }`}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold">{p.name}</p>
                        <p className="font-bold text-primary">
                          {formatGhs(Number(p.price_per_candidate))}
                          {p.pricing_mode === "per_candidate" && (
                            <span className="text-xs font-normal text-muted-foreground">
                              {" "}
                              per candidate
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.subjects.map((s: string) => (
                          <Badge key={s} variant="secondary" className="font-normal">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-4 py-3">
                      <h3 className="font-serif text-base font-bold">Order Summary</h3>
                    </div>
                    <dl className="divide-y divide-border text-sm">
                      <Row label="School name" value={form.school_name} />
                      <Row label="Mock type" value={mock?.name ?? "—"} />
                      <Row label="Number of candidates" value={String(candidates)} />
                      <Row label="Prediction package" value={product?.name ?? "—"} />
                      <Row
                        label="Prediction package (flat)"
                        value={product ? formatGhs(Number(product.price_per_candidate)) : "—"}
                      />
                      <Row label="Membership registration fee" value={formatGhs(200)} />
                      <div className="flex justify-between bg-secondary/50 px-4 py-3 font-bold">
                        <dt>Total amount</dt>
                        <dd className="text-primary">{formatGhs(total)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Login email" className="sm:col-span-2">
                      <Input value={form.school_email} readOnly className="bg-muted" />
                    </Field>
                    <Field label="Create password *">
                      <Input
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </Field>
                    <Field label="Confirm password *">
                      <Input
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary">
                    <Check className="size-7 text-primary" />
                  </div>
                  <h3 className="font-serif text-lg font-bold">Registration complete</h3>
                  <p className="text-sm text-muted-foreground">
                    Your school account has been created and order{" "}
                    <span className="font-semibold text-foreground">{orderNumber}</span> is
                    pending payment. Continue to your dashboard to pay with Paystack and unlock
                    your prediction.
                  </p>
                  <Button onClick={() => navigate({ to: "/dashboard" })} size="lg">
                    Go to my dashboard
                  </Button>
                </div>
              )}

              {step < 6 && (
                <div className="flex justify-between gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    disabled={step === 1 || submitting}
                  >
                    Back
                  </Button>
                  {step < 5 ? (
                    <Button onClick={next}>Continue</Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={submitting}>
                      {submitting ? "Creating account…" : "Create account & order"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

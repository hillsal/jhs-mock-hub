import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

import { memberSignIn } from "@/lib/member.functions";
import { saveMemberSession, type MemberSession } from "@/lib/member-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Reusable "MEMBER ACCESS" gate — Serial Number + PIN.
 * Used by every purchase flow and by the member account page.
 */
export function MemberAccess({
  title = "Member Access",
  description = "Enter the Serial Number and PIN issued at registration to continue.",
  onAuthenticated,
}: {
  title?: string;
  description?: string;
  onAuthenticated: (session: MemberSession) => void;
}) {
  const signIn = useServerFn(memberSignIn);
  const [membershipId, setMembershipId] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await signIn({ data: { membershipId, pin } });
      const session: MemberSession = {
        token: result.token,
        membershipId: result.member.membership_id,
        memberName: result.member.school_name,
      };
      saveMemberSession(session);
      onAuthenticated(session);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not verify your membership.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-secondary">
          <KeyRound className="size-5 text-primary" />
        </div>
        <CardTitle className="font-serif">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serial">Serial Number</Label>
            <Input
              id="serial"
              value={membershipId}
              onChange={(e) => setMembershipId(e.target.value)}
              placeholder="HEB-JHS-2026-0001"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              inputMode="numeric"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Verifying…" : "Continue"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Not a member yet?{" "}
            <Link to="/register" className="font-medium text-primary underline-offset-2 hover:underline">
              Complete the membership registration
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

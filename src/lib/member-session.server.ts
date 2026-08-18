/**
 * Signed member sessions.
 *
 * Members authenticate with their Serial Number + PIN (not a Supabase auth
 * account), so we mint a short-lived HMAC-signed token that server functions
 * can verify. The signing key never leaves the server.
 */

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function signingKeyMaterial() {
  const secret =
    process.env["MEMBER_SESSION_SECRET"] ?? process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  if (!secret) throw new Error("Member sessions are not configured.");
  return new TextEncoder().encode(secret);
}

async function hmac(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    signingKeyMaterial(),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function createMemberToken(memberId: string) {
  const payload = `${memberId}.${Date.now() + TOKEN_TTL_MS}`;
  return `${payload}.${await hmac(payload)}`;
}

/** Returns the member id for a valid, unexpired token, otherwise throws. */
export async function readMemberToken(token: string): Promise<string> {
  const parts = (token ?? "").split(".");
  if (parts.length !== 3) throw new Error("Your member session has ended. Please sign in again.");
  const [memberId, expires, signature] = parts as [string, string, string];
  const expected = await hmac(`${memberId}.${expires}`);
  if (expected.length !== signature.length) {
    throw new Error("Your member session has ended. Please sign in again.");
  }
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  if (mismatch !== 0 || Number(expires) < Date.now()) {
    throw new Error("Your member session has ended. Please sign in again.");
  }
  return memberId;
}

export type MemberRecord = {
  id: string;
  school_name: string;
  membership_id: string;
  membership_status: string;
  contact_person: string | null;
  school_email: string;
  school_phone: string;
  region: string;
  district: string;
  academic_year: string;
  mock_candidates: number;
  total_jhs_students: number;
  created_at: string;
};

/** Loads the member behind a token and enforces membership status. */
export async function requireActiveMember(token: string): Promise<MemberRecord> {
  const memberId = await readMemberToken(token);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("schools")
    .select(
      "id, school_name, membership_id, membership_status, contact_person, school_email, school_phone, region, district, academic_year, mock_candidates, total_jhs_students, created_at",
    )
    .eq("id", memberId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Member account not found.");
  if (data.membership_status === "suspended") {
    throw new Error("Your membership is currently suspended. Please contact the administrator.");
  }
  if (data.membership_status === "expired") {
    throw new Error("Your membership has expired. Please contact the administrator to renew.");
  }
  return data as MemberRecord;
}

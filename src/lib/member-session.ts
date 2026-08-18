const KEY = "heb.member.session";

export type MemberSession = {
  token: string;
  membershipId: string;
  memberName: string;
};

export function saveMemberSession(session: MemberSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function readMemberSession(): MemberSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MemberSession) : null;
  } catch {
    return null;
  }
}

export function clearMemberSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

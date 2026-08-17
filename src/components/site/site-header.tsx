import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/membership", label: "JHS Membership" },
  { to: "/register", label: "Register" },
];

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md heb-gradient font-serif text-sm font-bold text-primary-foreground">
            HEB
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-sm font-bold text-foreground">
              Hills Educational Consult
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Hills Examination Board
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-foreground bg-secondary" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
          {signedIn ? (
            <Button size="sm" onClick={() => navigate({ to: "/dashboard" })} className="ml-2">
              My Dashboard
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate({ to: "/auth" })} className="ml-2">
              School Login
            </Button>
          )}
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          className="rounded-md p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col p-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                {item.label}
              </Link>
            ))}
            <Button
              className="mt-2"
              onClick={() => {
                setOpen(false);
                navigate({ to: signedIn ? "/dashboard" : "/auth" });
              }}
            >
              {signedIn ? "My Dashboard" : "School Login"}
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}

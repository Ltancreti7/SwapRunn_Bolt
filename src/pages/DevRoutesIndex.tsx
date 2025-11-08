import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type LinkItem = { path: string; label: string; note?: string };

const publicRoutes: LinkItem[] = [
  { path: "/", label: "Home (/)", note: "Index" },
  { path: "/plasmic-home", label: "Plasmic Home" },
  { path: "/how-it-works", label: "How It Works" },
  { path: "/login", label: "Login" },
  { path: "/dealers/registration", label: "Dealers Registration" },
  { path: "/dealership/register", label: "Dealership Register (alias)" },
  { path: "/billing", label: "Billing Settings" },
  { path: "/dealer/signin", label: "Dealer Signin" },
  { path: "/staff/signup", label: "Staff Signup" },
  { path: "/driver/auth", label: "Driver Auth" },
  { path: "/driver-auth", label: "Driver Auth (alias)" },
  { path: "/auth/reset", label: "Password Reset Request" },
  { path: "/auth/password-update", label: "Password Update" },
  { path: "/track/demo-token", label: "Track (demo token)", note: "replace token as needed" },
  { path: "/privacy", label: "Privacy" },
  { path: "/terms", label: "Terms" },
  { path: "/contact", label: "Contact" },
  { path: "/plasmic/anything", label: "Plasmic Catch-All", note: "replace path as needed" },
  { path: "/accept-invitation/demo", label: "Accept Invitation (demo token)" },
];

const dealerRoutes: LinkItem[] = [
  { path: "/dealer/dashboard", label: "Dealer Dashboard" },
  { path: "/dealer/admin", label: "Dealer Admin Dashboard" },
  { path: "/dealer/create-job", label: "Create Job" },
  { path: "/dealer/request", label: "Request (legacy -> Create Job)" },
  { path: "/dealer/request-simple", label: "Request Simple (legacy)" },
  { path: "/dealer/settings", label: "Dealer Settings" },
  { path: "/dealer/employees", label: "Dealer Employees" },
];

const driverRoutes: LinkItem[] = [
  { path: "/driver/requests", label: "Driver Requests" },
  { path: "/driver/dashboard", label: "Driver Dashboard" },
];

export default function DevRoutesIndex() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const quickSignUp = async (role: "dealer" | "driver") => {
    try {
      setBusy(role);
      setMsg(null);
      const email = `${role}+${Math.random().toString(36).slice(2, 7)}@local.dev`;
      const password = "password123";
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { user_type: role, full_name: `${role} demo` } },
      } as any);
      if (error) throw new Error(error.message);
      setMsg(`${role} user created: ${email}`);
      if (role === "dealer") navigate("/dealer/admin");
      if (role === "driver") navigate("/driver/requests");
    } catch (e: any) {
      setMsg(e.message || String(e));
    } finally {
      setBusy(null);
    }
  };

  const quickSignOut = async () => {
    await supabase.auth.signOut();
    setMsg("Signed out.");
  };

  const Section = ({ title, items }: { title: string; items: LinkItem[] }) => (
    <Card className="bg-[#111] border-white/10">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid md:grid-cols-2 gap-2">
          {items.map((r) => (
            <li key={r.path}>
              <a href={r.path} className="text-[#E11900] underline">
                {r.label}
              </a>
              {r.note && <span className="text-white/50 ml-2">({r.note})</span>}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dev Routes Index</h1>
        <div className="flex gap-2">
          <Button onClick={() => quickSignUp("dealer")} disabled={busy!==null} className="bg-[#E11900]">
            {busy === "dealer" ? "Creating Dealer…" : "Quick Create Dealer + Go"}
          </Button>
          <Button onClick={() => quickSignUp("driver")} disabled={busy!==null} variant="outline">
            {busy === "driver" ? "Creating Driver…" : "Quick Create Driver + Go"}
          </Button>
          <Button onClick={quickSignOut} variant="secondary">Sign out</Button>
        </div>
      </div>
      {msg && <p className="text-white/70">{msg}</p>}
      <Section title="Public" items={publicRoutes} />
      <Section title="Dealer (Protected)" items={dealerRoutes} />
      <Section title="Driver (Protected)" items={driverRoutes} />
      <Card className="bg-[#111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-white/70 space-y-1 text-sm">
          <p>- Protected routes require a session. Use the Quick Create buttons above.</p>
          <p>- In local mode, email confirmation is bypassed and data is stored in-memory + localStorage.</p>
          <p>- For track/invitation routes, replace demo token with a real one when testing fully.</p>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const OWNER_EMAIL = "shehab.star8@gmail.com";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      const userEmail = data.user?.email?.toLowerCase() || "";
      if (!mounted) return;
      if (userEmail === OWNER_EMAIL) setAuthorized(true);
      else if (data.user) {
        await supabase.auth.signOut();
        setMessage("This account is not authorized to access the system.");
      }
      setChecking(false);
    }
    checkUser();
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const userEmail = session?.user?.email?.toLowerCase() || "";
      if (userEmail === OWNER_EMAIL) {
        setAuthorized(true);
        setMessage("");
      } else if (session) {
        setAuthorized(false);
        await supabase.auth.signOut();
        setMessage("This account is not authorized to access the system.");
      } else setAuthorized(false);
      setChecking(false);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  async function requestMagicLink(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (email.trim().toLowerCase() !== OWNER_EMAIL) {
      setMessage("Only the system owner account is allowed to sign in.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: OWNER_EMAIL,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    setMessage(error ? error.message : "A secure sign-in link was sent to the owner email.");
  }

  if (checking) return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6"><div className="bg-white rounded-xl shadow-sm p-8 w-full max-w-md text-center"><h1 className="text-xl font-semibold">DOCUMENT CONTROL</h1><p className="text-slate-500 mt-2">Checking access...</p></div></main>;
  if (authorized) return <>{children}</>;

  return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
    <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-md">
      <h1 className="text-2xl font-bold text-slate-900">DOCUMENT CONTROL</h1>
      <p className="text-sm text-slate-500 mt-2">This system is private and restricted to the authorized owner account.</p>
      <form onSubmit={requestMagicLink} className="mt-7 space-y-4">
        <label className="block text-sm font-medium text-slate-700">Owner email
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" autoComplete="email" required />
        </label>
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-slate-900 text-white px-4 py-2.5 disabled:opacity-50">{busy ? "Sending..." : "Send secure sign-in link"}</button>
      </form>
      {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
    </div>
  </main>;
}

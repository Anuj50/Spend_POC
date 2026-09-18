"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, Wallet } from "lucide-react";
import { api } from "../../lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    const f = new FormData(event.currentTarget);
    const password = f.get("password");
    const confirm = f.get("confirm");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setStatus("submitting");
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, token, password })
      });
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  if (!token || !email) {
    return (
      <div className="auth-shell">
        <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-xl">
          <h2 className="text-xl font-bold">Invalid link</h2>
          <p className="mt-2 text-sm text-gray-500">This password reset link is missing information. Request a new one from the sign-in page.</p>
          <a href="/" className="primary mt-6 inline-block text-center">Back to sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="flex items-center gap-3 text-white">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><Wallet size={22} /></div>
        <div>
          <p className="font-bold leading-tight">Spend It Wisely</p>
          <p className="text-xs text-white/50 leading-tight">Smart money management</p>
        </div>
      </div>
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl">
        {status === "done" ? (
          <>
            <h2 className="text-xl font-bold">Password reset</h2>
            <p className="mt-2 text-sm text-gray-500">Your password has been updated. You can now sign in.</p>
            <a href="/" className="primary mt-6 inline-block text-center">Back to sign in</a>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold">Set a new password</h2>
            <p className="mt-2 text-sm text-gray-500">for {email}</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="field-icon-wrap">
                <Lock size={18} />
                <input required name="password" type="password" minLength="6" placeholder="New password (6+ characters)" className="field" />
              </div>
              <div className="field-icon-wrap">
                <Lock size={18} />
                <input required name="confirm" type="password" minLength="6" placeholder="Confirm new password" className="field" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button disabled={status === "submitting"} className="primary">{status === "submitting" ? "Saving..." : "Reset password"}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

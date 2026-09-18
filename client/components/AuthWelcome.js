"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User, Wallet } from "lucide-react";
import { api, saveSession } from "../lib/api";

export default function AuthWelcome({ onAuthed }) {
  const [mode, setMode] = useState("signin");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStatus, setForgotStatus] = useState("idle");
  const [forgotError, setForgotError] = useState("");

  async function submit(event, path) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const f = new FormData(event.currentTarget);
    try {
      const data = await api(path, {
        method: "POST",
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          password: f.get("password")
        })
      });
      saveSession(data);
      onAuthed(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openForgotPassword() {
    setForgotMode(true);
    setForgotStatus("idle");
    setForgotError("");
  }

  function closeForgotPassword() {
    setForgotMode(false);
    setForgotStatus("idle");
    setForgotError("");
  }

  async function submitForgotPassword(event) {
    event.preventDefault();
    setForgotError("");
    setForgotStatus("sending");
    const f = new FormData(event.currentTarget);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: f.get("email") })
      });
      setForgotStatus("sent");
    } catch (err) {
      setForgotError(err.message);
      setForgotStatus("idle");
    }
  }

  if (forgotMode) {
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
          <h2 className="text-2xl font-bold">Reset password</h2>
          <p className="mt-2 text-sm text-gray-500">Enter your account email and we'll send you a link to reset your password.</p>
          {forgotStatus === "sent" ? (
            <div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
              If that email is registered, a reset link has been sent. Check your inbox (and spam folder).
            </div>
          ) : (
            <form onSubmit={submitForgotPassword} className="mt-6 space-y-4">
              <TextField icon={<Mail size={18} />} name="email" type="email" placeholder="Email address" />
              {forgotError && <p className="text-sm text-red-600">{forgotError}</p>}
              <button disabled={forgotStatus === "sending"} className="primary">{forgotStatus === "sending" ? "Sending..." : "Send reset link"}</button>
            </form>
          )}
          <button type="button" onClick={closeForgotPassword} className="mt-5 w-full text-sm text-gray-500">Back to sign in</button>
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

      {/* Desktop sliding card */}
      <div className={`auth-card hidden md:block ${mode === "signup" ? "right-panel-active" : ""}`}>
        <div className="auth-form-container auth-sign-in">
          <form onSubmit={(e) => submit(e, "/auth/login")} className="w-full space-y-4 px-10">
            <h2 className="text-2xl font-bold">Sign in</h2>
            <p className="text-sm text-gray-500">Welcome back. Let's see where your money went.</p>
            <TextField icon={<Mail size={18} />} name="email" type="email" placeholder="Email address" />
            <PasswordField name="password" placeholder="Password" />
            <button type="button" onClick={openForgotPassword} className="-mt-2 text-sm font-semibold text-blue-600">Forgot password?</button>
            {mode === "signin" && error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={submitting} className="primary">{submitting ? "Signing in..." : "Sign in"}</button>
          </form>
        </div>

        <div className="auth-form-container auth-sign-up">
          <form onSubmit={(e) => submit(e, "/auth/register")} className="w-full space-y-4 px-10">
            <h2 className="text-2xl font-bold">Create account</h2>
            <p className="text-sm text-gray-500">Start tracking expenses in a couple of minutes.</p>
            <TextField icon={<User size={18} />} name="name" type="text" placeholder="Full name" />
            <TextField icon={<Mail size={18} />} name="email" type="email" placeholder="Email address" />
            <PasswordField name="password" placeholder="Password (6+ characters)" />
            {mode === "signup" && error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={submitting} className="primary">{submitting ? "Creating account..." : "Create account"}</button>
          </form>
        </div>

        <div className="auth-overlay-container">
          <div className="auth-overlay">
            <div className="auth-overlay-panel auth-overlay-left">
              <h2 className="text-2xl font-bold">Welcome back!</h2>
              <p className="mt-3 text-sm text-white/70">Already have an account? Sign in to keep tracking your spending.</p>
              <button type="button" onClick={() => { setMode("signin"); setError(""); }} className="mt-6 rounded-xl border border-white/40 px-8 py-3 text-sm font-semibold hover:bg-white/10">Sign in</button>
            </div>
            <div className="auth-overlay-panel auth-overlay-right">
              <h2 className="text-2xl font-bold">Hello, friend!</h2>
              <p className="mt-3 text-sm text-white/70">New here? Create an account to start tracking your expenses.</p>
              <button type="button" onClick={() => { setMode("signup"); setError(""); }} className="mt-6 rounded-xl border border-white/40 px-8 py-3 text-sm font-semibold hover:bg-white/10">Sign up</button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile stacked card */}
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl md:hidden">
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
          <button onClick={() => { setMode("signin"); setError(""); }} className={`rounded-lg py-2 text-sm font-semibold transition ${mode === "signin" ? "bg-blue-600 text-white" : "text-gray-500"}`}>Sign in</button>
          <button onClick={() => { setMode("signup"); setError(""); }} className={`rounded-lg py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-blue-600 text-white" : "text-gray-500"}`}>Sign up</button>
        </div>

        {mode === "signin" ? (
          <form onSubmit={(e) => submit(e, "/auth/login")} className="space-y-4">
            <TextField icon={<Mail size={18} />} name="email" type="email" placeholder="Email address" />
            <PasswordField name="password" placeholder="Password" />
            <button type="button" onClick={openForgotPassword} className="-mt-2 text-sm font-semibold text-blue-600">Forgot password?</button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={submitting} className="primary">{submitting ? "Signing in..." : "Sign in"}</button>
          </form>
        ) : (
          <form onSubmit={(e) => submit(e, "/auth/register")} className="space-y-4">
            <TextField icon={<User size={18} />} name="name" type="text" placeholder="Full name" />
            <TextField icon={<Mail size={18} />} name="email" type="email" placeholder="Email address" />
            <PasswordField name="password" placeholder="Password (6+ characters)" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={submitting} className="primary">{submitting ? "Creating account..." : "Create account"}</button>
          </form>
        )}
      </div>
    </div>
  );
}

function TextField({ icon, ...props }) {
  return (
    <div className="field-icon-wrap">
      {icon}
      <input required className="field" {...props} />
    </div>
  );
}

function PasswordField({ name, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field-icon-wrap">
      <Lock size={18} />
      <input required name={name} type={show ? "text" : "password"} minLength="6" placeholder={placeholder} className="field pr-11" />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

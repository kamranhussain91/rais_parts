/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from './AppContext';
import { Lock, Mail, User as UserIcon, ShieldAlert, Loader2 } from 'lucide-react';

type Mode = 'signin' | 'signup';

export const LoginView: React.FC = () => {
  const { setCurrentUser, refreshData } = useApp();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const payload =
        mode === 'signup'
          ? { name: name.trim(), email: email.trim(), password }
          : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setErrorMsg(result.error || 'Authentication failed. Please try again.');
        return;
      }

      // Persist session, then hydrate the full database for the app.
      localStorage.setItem('rais_honda_current_user_id', result.user.id);
      setCurrentUser(result.user);
      await refreshData();
    } catch {
      setErrorMsg('Network error — could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans text-slate-800" id="login-module-layout">

      {/* BRAND & HEADER PORTION */}
      <div className="flex flex-col items-center gap-3 mb-8 select-none text-center animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center font-black italic text-2xl leading-none shadow-md">
          H
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Rais HONDA</h1>
          <span className="text-[10px] uppercase tracking-widest text-red-600 font-extrabold block mt-2 font-mono">Motorcycle Parts</span>
        </div>
      </div>

      {/* AUTH CARD */}
      <div className="w-full max-w-sm bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-8 animate-in fade-in duration-500">
        <div className="mb-6 text-center">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
            {isSignup ? 'Create Account' : 'Operator Authentication'}
          </h2>
          <p className="text-[10px] text-slate-400 font-sans mt-1">
            {isSignup
              ? 'Register a new operator account. The first account created becomes the Super Admin owner.'
              : 'Sign in with your email and password to unlock system access.'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[11px] font-extrabold text-red-600 flex items-start gap-2 mb-5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {isSignup && (
            <div className="space-y-1">
              <label className="block text-[9px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Enter your name"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white focus:outline-none pl-9 pr-4 py-2 text-[11px] font-bold text-slate-800 rounded-lg transition-all font-mono"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* EMAIL INPUT */}
          <div className="space-y-1">
            <label className="block text-[9px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white focus:outline-none pl-9 pr-4 py-2 text-[11px] font-bold text-slate-800 rounded-lg transition-all font-mono"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* PASSWORD INPUT */}
          <div className="space-y-1">
            <label className="block text-[9px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="password"
                required
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder="Enter Password"
                className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white focus:outline-none pl-9 pr-4 py-2 text-[11px] font-bold text-slate-800 rounded-lg transition-all font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-lg text-[11px] transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider font-mono mt-4"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {submitting ? 'Please wait…' : isSignup ? 'Create Account' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => { setMode(isSignup ? 'signin' : 'signup'); setErrorMsg(null); }}
            className="text-[10px] font-bold text-slate-500 hover:text-red-600 transition-colors font-mono uppercase tracking-wider cursor-pointer"
          >
            {isSignup ? 'Already have an account? Sign in' : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
};

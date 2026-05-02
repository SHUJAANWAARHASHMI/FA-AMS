
import React, { useState } from 'react';
import { Eye, EyeOff, Building2, User as UserIcon, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: (username: string, password: string, portal: 'admin' | 'employee', campus?: string) => { success: boolean };
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [campus, setCampus] = useState('Main Campus');
  const [portal, setPortal] = useState<'admin' | 'employee'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = onLogin(username, password, portal, campus, rememberMe);
    if (!result.success) {
      setError('Invalid username or password for selected campus/portal.');
    }
  };

  return (
    <div className="min-h-screen bg-bento-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] border-2 border-bento-ink/5 rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] border-2 border-bento-ink/5 rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full sm:w-[400px] bento-box shadow-[8px_8px_0px_#141414] sm:shadow-[12px_12px_0px_#141414] animate-in zoom-in-95 duration-500 overflow-hidden">
        <div className="bg-bento-ink p-6 sm:p-10 text-center border-b-[6px] border-bento-accent">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white text-bento-ink font-mono font-bold text-2xl sm:text-3xl border-2 border-bento-accent mb-4 sm:mb-6">
            FA
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter">Fiqh Academy <span className="font-light opacity-50">Logistics</span></h1>
          <p className="text-[8px] sm:text-[10px] text-white font-bold uppercase tracking-[0.2em] mt-1 sm:mt-2 opacity-60">Authentication Authority</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6 sm:space-y-8 bg-white">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 sm:p-4 border-l-4 border-red-600 text-[10px] font-black uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <div className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-bento-ink uppercase tracking-tight mb-2 opacity-50">Select Terminal Access</label>
              <div className="flex flex-col sm:flex-row bg-bento-bg p-1 border border-bento-line/10 gap-1 sm:gap-0">
                <button
                  type="button"
                  onClick={() => setPortal('admin')}
                  className={cn(
                    "flex-1 py-2.5 sm:py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    portal === 'admin' ? "bg-bento-ink text-white" : "text-bento-ink/40 hover:text-bento-ink"
                  )}
                >
                  ADMINISTRATION
                </button>
                <button
                  type="button"
                  onClick={() => setPortal('employee')}
                  className={cn(
                    "flex-1 py-2.5 sm:py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    portal === 'employee' ? "bg-bento-ink text-white" : "text-bento-ink/40 hover:text-bento-ink"
                  )}
                >
                  STAFF PORTAL
                </button>
              </div>
            </div>

            <div className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-bento-ink uppercase tracking-widest mb-2">Identifier</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon size={16} className="text-bento-ink/40" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 sm:py-3.5 bg-bento-bg/30 border border-bento-line focus:outline-hidden focus:ring-1 focus:ring-bento-ink text-base sm:text-sm font-bold uppercase tracking-tight"
                    placeholder="Enter ID / Username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-bento-ink uppercase tracking-widest mb-2">Access Key</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={16} className="text-bento-ink/40" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-3 sm:py-3.5 bg-bento-bg/30 border border-bento-line focus:outline-hidden focus:ring-1 focus:ring-bento-ink text-base sm:text-sm font-bold"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-bento-ink/40 hover:text-bento-ink"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {portal === 'admin' && (
                <div>
                  <label className="block text-[10px] font-bold text-bento-ink uppercase tracking-widest mb-2">Campus Terminal</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Building2 size={16} className="text-bento-ink/40" />
                    </div>
                    <select
                      value={campus}
                      onChange={(e) => setCampus(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3 sm:py-3.5 bg-bento-bg/30 border border-bento-line focus:outline-hidden focus:ring-1 focus:ring-bento-ink text-base sm:text-[10px] font-bold sm:font-black uppercase tracking-normal sm:tracking-[0.2em] bg-white appearance-none"
                    >
                      <option value="Main Campus">Main Campus</option>
                      <option value="Johar Campus">Johar Campus</option>
                      <option value="Masjid Campus">Masjid Campus</option>
                      <option value="Maktab Campus">Maktab Campus</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center self-start">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-bento-ink border-bento-line focus:ring-0 focus:ring-offset-0"
              />
              <label htmlFor="remember-me" className="ml-2 block text-[10px] font-bold text-bento-ink uppercase">
                Persist Session
              </label>
            </div>
            <button
              type="button"
              onClick={() => alert('Please contact Academy IT Administration.')}
              className="text-[10px] font-bold text-bento-ink opacity-40 hover:opacity-100 uppercase underline self-end sm:self-auto"
            >
              LOST KEY?
            </button>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-4 px-4 bg-bento-ink text-white font-black text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] border border-bento-line hover:bg-black transition-all active:scale-95 shadow-[4px_4px_0px_#2A5C43] sm:shadow-[8px_8px_0px_#2A5C43]"
          >
            AUTHORIZE ACCOUNT
          </button>

          <div className="pt-4 border-t border-bento-line/10 space-y-3">
            <p className="text-[10px] font-black text-bento-ink/30 uppercase tracking-[0.1em] text-center">Reference Credentials</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-bento-bg/50 p-3 border border-bento-line/10">
                <p className="text-[9px] font-black uppercase opacity-40 mb-1">Admin Access</p>
                <p className="text-[10px] font-mono font-bold">UID: shuja</p>
                <p className="text-[10px] font-mono font-bold">KEY: password1</p>
              </div>
              <div className="bg-bento-bg/50 p-3 border border-bento-line/10">
                <p className="text-[9px] font-black uppercase opacity-40 mb-1">Staff Access</p>
                <p className="text-[10px] font-mono font-bold">UID: FAMC1001</p>
                <p className="text-[10px] font-mono font-bold">KEY: abc123</p>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <div className="mt-10 text-[9px] font-black text-bento-ink/30 uppercase tracking-[0.4em]">
        © 2026 FIQH ACADEMY | SYSTEM VERSION 2.4.0
      </div>
    </div>
  );
};

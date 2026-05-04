import React, { useState } from 'react';
import { Eye, EyeOff, Building2, User as UserIcon, Lock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: (username: string, password: string, portal: 'admin' | 'employee', campus?: string, rememberMe?: boolean) => { success: boolean, locked?: boolean };
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [campus, setCampus] = useState('Main Campus');
  const [portal, setPortal] = useState<'admin' | 'employee'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Slight delay for animation feel
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const result = onLogin(username, password, portal, campus, rememberMe);
    if (!result.success) {
      if (result.locked) {
        setError('Account Locked. Contact Admin.');
      } else {
        setError('Invalid credentials.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.05, 0.03] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-bento-accent rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.02, 0.04, 0.02] }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-bento-ink rounded-full blur-[100px] pointer-events-none"
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[380px] z-10"
      >
        <div className="bg-white rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="pt-8 pb-4 px-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-bento-ink text-white rounded-2xl shadow-xl shadow-bento-ink/20 mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-xl font-black tracking-tighter">FA</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
              FIQH ACADEMY
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Logistics Portal</p>
          </div>

          {/* Portal Switcher */}
          <div className="px-8 mt-4">
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button
                type="button"
                onClick={() => setPortal('admin')}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg relative",
                  portal === 'admin' ? "bg-white text-bento-ink shadow-sm ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600"
                )}
              >
                ADMIN
              </button>
              <button
                type="button"
                onClick={() => setPortal('employee')}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg",
                  portal === 'employee' ? "bg-white text-bento-ink shadow-sm ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600"
                )}
              >
                STAFF
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 text-[10px] font-black uppercase tracking-widest text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-bento-ink">Identifier</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-bento-ink transition-colors">
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-ink/5 focus:bg-white focus:border-slate-300 transition-all text-sm font-bold placeholder:font-normal placeholder:text-slate-300"
                    placeholder="Username or ID"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 group-focus-within:text-bento-ink">Access Key</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-bento-ink">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-ink/5 focus:bg-white focus:border-slate-300 transition-all text-sm font-bold placeholder:font-normal placeholder:text-slate-300"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {portal === 'admin' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Terminal</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Building2 size={16} />
                      </div>
                      <select
                        value={campus}
                        onChange={(e) => setCampus(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-bento-ink/5 focus:bg-white focus:border-slate-300 transition-all text-[10px] font-black uppercase tracking-wider appearance-none"
                      >
                        <option value="Main Campus">Main Campus</option>
                        <option value="Johar Campus">Johar Campus</option>
                        <option value="Masjid Campus">Masjid Campus</option>
                        <option value="Maktab Campus">Maktab Campus</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={cn(
                    "w-8 h-4 bg-slate-200 rounded-full transition-colors",
                    rememberMe ? "bg-bento-accent" : ""
                  )}></div>
                  <div className={cn(
                    "absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform shadow-sm",
                    rememberMe ? "translate-x-4" : ""
                  )}></div>
                </div>
                <span className="ml-2 text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Remain Active</span>
              </label>
              
              <button
                type="button"
                onClick={() => alert('Contact Admin')}
                className="text-[9px] font-black text-slate-300 hover:text-bento-ink uppercase tracking-widest transition-colors"
              >
                Help
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full flex items-center justify-center py-4 bg-bento-ink text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-bento-ink/20 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group",
                isSubmitting && "animate-pulse"
              )}
            >
              <span className="mr-2">{isSubmitting ? 'Verifying...' : 'Authorize Access'}</span>
              {!isSubmitting && <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
          
          <div className="px-8 pb-8 flex flex-col gap-2">
             <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest text-center mb-1">Quick Access Demo</p>
             <div className="grid grid-cols-2 gap-2 text-[8px] font-black text-slate-400">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                  <span className="opacity-50">ADMIN:</span> shuja
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                  <span className="opacity-50">STAFF:</span> FAMC1001
                </div>
             </div>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]"
      >
        FA LOGISTICS v2.4.0
      </motion.div>
    </div>
  );
};

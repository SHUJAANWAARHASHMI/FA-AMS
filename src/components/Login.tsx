import React, { useState } from 'react';
import { Eye, EyeOff, Building2, User as UserIcon, Lock, ShieldCheck, HelpCircle } from 'lucide-react';
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
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = onLogin(username, password, portal, campus, rememberMe);
    if (!result.success) {
      setError(result.locked ? 'Account Locked. Contact Admin.' : 'Invalid credentials.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col relative overflow-hidden font-jakarta">
      {/* Background Illustrations Placeholder */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <svg className="w-full h-full" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="200" r="300" fill="url(#grad1)" fillOpacity="0.3" />
          <circle cx="1200" cy="700" r="400" fill="url(#grad2)" fillOpacity="0.2" />
          {/* Schematic Map Lines */}
          <path d="M100 100 Q 400 150 700 100 T 1300 200" stroke="#0066FF" strokeWidth="2" strokeDasharray="10 10" opacity="0.2" />
          <path d="M200 800 Q 600 700 900 850 T 1400 750" stroke="#0066FF" strokeWidth="2" strokeDasharray="10 10" opacity="0.2" />
          <defs>
            <radialGradient id="grad1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(200 200) rotate(90) scale(300)">
              <stop stopColor="#0066FF" />
              <stop offset="1" stopColor="#0066FF" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="grad2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1200 700) rotate(90) scale(400)">
              <stop stopColor="#002B49" />
              <stop offset="1" stopColor="#002B49" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Side: Logo and Intro */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-col items-center lg:items-start text-center lg:text-left space-y-8"
        >
          <div className="flex flex-col items-center lg:items-start space-y-4">
            <div className="relative w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-2xl overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-tr from-primary to-primary-light opacity-50" />
               <ShieldCheck className="text-white w-16 h-16 relative z-10" />
            </div>
            <div className="space-y-1">
              <h1 className="text-5xl font-extrabold text-primary tracking-tight uppercase">
                FIQH ACADEMY
              </h1>
              <div className="flex items-center space-x-4">
                <div className="h-[2px] w-12 bg-warning/50 rounded-full" />
                <p className="text-2xl font-bold text-secondary">Logistics Portal</p>
                <div className="h-[2px] w-12 bg-warning/50 rounded-full" />
              </div>
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            <p className="text-xl font-bold text-text-dark">Smart. Secure. Seamless.</p>
            <p className="text-text-gray leading-relaxed">
              Access real-time logistics operations, manage deliveries, assets, and reports with efficiency and accuracy.
            </p>
          </div>

          {/* Truck and Warehouse Illustration Placeholder */}
          <div className="relative w-full max-w-md h-64 bg-accent/20 rounded-3xl border border-secondary/10 overflow-hidden flex items-end justify-center p-8">
             <motion.div 
               animate={{ x: [0, 20, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="w-48 h-24 bg-white rounded-xl shadow-lg border border-border flex items-center justify-center p-4"
             >
                <div className="w-full h-full bg-secondary/10 rounded-lg flex items-center justify-center text-secondary">
                   <ShieldCheck size={40} />
                </div>
             </motion.div>
             {/* Map dots */}
             <div className="absolute inset-0 grid grid-cols-6 gap-4 p-8 opacity-20 pointer-events-none">
                {[...Array(24)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-secondary rounded-full" />
                ))}
             </div>
          </div>
        </motion.div>

        {/* Right Side: Login Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[500px] mx-auto lg:mx-0"
        >
          <div className="bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-border overflow-hidden">
            {/* Logo for mobile */}
            <div className="lg:hidden p-8 text-center border-b border-border">
              <h1 className="text-2xl font-bold text-primary">FIQH ACADEMY</h1>
              <p className="text-sm font-bold text-secondary">Logistics Portal</p>
            </div>

            {/* Portal Tabs */}
            <div className="flex">
              <button
                onClick={() => setPortal('admin')}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-3 py-6 transition-all relative overflow-hidden",
                  portal === 'admin' 
                    ? "bg-primary text-white" 
                    : "bg-white text-text-gray hover:bg-bg"
                )}
              >
                <UserIcon size={20} />
                <span className="font-bold uppercase tracking-widest text-sm">ADMIN</span>
                {portal === 'admin' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-secondary" />}
              </button>
              <button
                onClick={() => setPortal('employee')}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-3 py-6 transition-all relative overflow-hidden",
                  portal === 'employee' 
                    ? "bg-primary text-white" 
                    : "bg-white text-text-gray hover:bg-bg"
                )}
              >
                <Building2 size={20} />
                <span className="font-bold uppercase tracking-widest text-sm">STAFF</span>
                {portal === 'employee' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-secondary" />}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 lg:p-10 space-y-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-error/5 text-error p-4 rounded-xl border border-error/10 text-xs font-bold text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-dark ml-1">Identifier</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary">
                      <UserIcon size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="login-input pl-12"
                      placeholder="Username or ID"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-dark ml-1">Access Key</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="login-input pl-12 pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-gray/50 hover:text-secondary transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-dark ml-1">Terminal</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary">
                      <Building2 size={18} />
                    </div>
                    <select
                      value={campus}
                      onChange={(e) => setCampus(e.target.value)}
                      className="login-input pl-12 appearance-none font-medium"
                    >
                      <option value="Main Campus">Main Campus</option>
                      <option value="Johar Campus">Johar Campus</option>
                      <option value="Masjid Campus">Masjid Campus</option>
                      <option value="Maktab Campus">Maktab Campus</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-gray/50">
                       <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
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
                      "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
                      rememberMe ? "bg-secondary border-secondary" : "bg-white border-border group-hover:border-secondary/50"
                    )}>
                      {rememberMe && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-text-gray group-hover:text-text-dark transition-colors">Remain Active</span>
                </label>
                
                <button
                  type="button"
                  className="flex items-center space-x-1.5 text-sm font-medium text-secondary hover:text-secondary-dark transition-colors"
                >
                  <HelpCircle size={16} />
                  <span>Help</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "btn-primary w-full h-14 text-base",
                  isSubmitting && "opacity-80"
                )}
              >
                {isSubmitting ? (
                   <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    <span>Authorize Access</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="w-full bg-primary py-8 px-4 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:row items-center justify-between space-y-4 md:space-y-0 text-[11px] font-medium text-white/60 tracking-wider">
          <p>© 2025 FIQH ACADEMY. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span className="hidden md:block opacity-30">|</span>
            <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
            <span className="hidden md:block opacity-30">|</span>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const ChevronDown = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

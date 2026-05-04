
import React, { useState, useMemo } from 'react';
import { User, CampusCode, UserRole, SystemSettings } from '../../types';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Key, 
  X, 
  Check, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Copy, 
  Filter,
  Plus,
  MapPin,
  Settings
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AdminControlsProps {
  users: User[];
  user: User;
  settings: SystemSettings;
  onUpdateUsers: (users: User[]) => void;
  onUpdateSettings: (settings: SystemSettings) => void;
}

export const AdminControls: React.FC<AdminControlsProps> = ({ users, user, settings, onUpdateUsers, onUpdateSettings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const [settingsError, setSettingsError] = useState<string | null>(null);

  const handleToggleLocation = async () => {
    const newSettings = { ...settings, enforceLocation: !settings.enforceLocation };
    onUpdateSettings(newSettings);
    setSettingsError(null);
    
    // Test persistence immediately
    try {
      await supabaseService.saveSystemSettings(newSettings);
    } catch (err: any) {
      setSettingsError(err.message || 'Sync failed');
    }
  };

  const [formData, setFormData] = useState<User>({
    id: '',
    username: '',
    password: '',
    name: '',
    email: '',
    campus: 'Main Campus',
    role: 'user',
    accountLocked: false,
    createdAt: ''
  });

  const generateUserId = () => {
    const lastId = users.reduce((max, u) => {
      if (!u.id) return max;
      const num = parseInt(u.id.replace('USR', ''));
      return num > max ? num : max;
    }, 0);
    return `USR${(lastId + 1).toString().padStart(3, '0')}`;
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'locked' ? u.accountLocked : !u.accountLocked);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleOpenModal = (u?: User) => {
    if (u) {
      setEditingUser(u);
      setFormData({ ...u });
    } else {
      setEditingUser(null);
      setFormData({
        id: generateUserId(),
        username: '',
        password: '',
        name: '',
        email: '',
        campus: 'Main Campus',
        role: 'user',
        accountLocked: false,
        createdAt: new Date().toISOString()
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenCloneModal = (u: User) => {
    const newId = generateUserId();
    setFormData({
      ...u,
      id: newId,
      name: `${u.name} (Copy)`,
      username: `${u.username}_copy`,
      password: '',
      createdAt: new Date().toISOString(),
      accountLocked: false
    });
    setIsCloneModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUsers(users.map(u => u.id === editingUser.id ? formData : u));
    } else {
      if (users.find(u => u.username === formData.username)) {
        alert('Username already exists!');
        return;
      }
      onUpdateUsers([...users, formData]);
    }
    setIsModalOpen(false);
  };

  const handleCloneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.find(u => u.username === formData.username)) {
      alert('Username already exists!');
      return;
    }
    onUpdateUsers([...users, formData]);
    setIsCloneModalOpen(false);
  };

  const handleDelete = (uId: string) => {
    if (uId === user.id) {
      alert('Cannot delete your own account!');
      return;
    }
    if (confirm('Are you sure you want to permanently revoke this user\'s access?')) {
      onUpdateUsers(users.filter(u => u.id !== uId));
    }
  };

  const handleToggleLock = (targetUser: User) => {
    if (targetUser.id === user.id) {
      alert('Cannot lock your own account!');
      return;
    }
    onUpdateUsers(users.map(u => 
      u.id === targetUser.id ? { ...u, accountLocked: !u.accountLocked } : u
    ));
  };

  const handleResetPassword = (targetUser: User) => {
    if (confirm(`Reset password for ${targetUser.name} to "abc123"?`)) {
      onUpdateUsers(users.map(u => 
        u.id === targetUser.id ? { ...u, password: 'abc123' } : u
      ));
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Global System Configuration */}
      {user.role === 'admin' && (
        <div className="bento-box bg-bento-ink text-white border-bento-accent border-l-[6px]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Settings size={20} className="text-bento-accent animate-spin-slow" />
                <h2 className="text-sm font-black uppercase tracking-[0.4em]">Strategic Overrides</h2>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xl leading-relaxed">
                Configure global security protocols. These settings override individual user configurations and affect system-wide behavior.
              </p>
            </div>
            
            <div className="flex items-center space-x-4 bg-white/5 p-4 border border-white/10">
              <div className="flex items-center space-x-3 mr-6">
                <MapPin size={18} className={cn(settings.enforceLocation ? "text-bento-accent" : "text-slate-500")} />
                <div>
                  <div className="text-[9px] font-black uppercase tracking-tighter">GPS Verification</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase">{settings.enforceLocation ? 'ENFORCED GLOBALLY' : 'BYPASSED'}</div>
                </div>
              </div>
              
              <button 
                onClick={handleToggleLocation}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                  settings.enforceLocation ? "bg-bento-accent" : "bg-slate-700"
                )}
              >
                <span 
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                    settings.enforceLocation ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>

          {settingsError && (
            <div className="mt-6 border-t border-white/10 pt-4 animate-in slide-in-from-top duration-300">
              <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-sm flex items-start space-x-3">
                <ShieldCheck size={16} className="text-red-400 mt-0.5 shrink-0" />
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-red-100">Persistence Protocol Failure (Error: {settingsError.includes('cache') ? 'Table Missing' : 'RLS Violation'})</p>
                  <p className="text-[9px] font-bold text-slate-300 leading-relaxed uppercase">
                    Your database permissions are blocking this update. To fix this permanently, paste the following into your Supabase SQL Editor:
                  </p>
                  <div className="bg-black/40 p-3 font-mono text-[9px] text-bento-accent border border-white/10 select-all cursor-copy">
                    {settingsError.includes('cache') ? (
                      `CREATE TABLE IF NOT EXISTS public.system_settings (
  id INT PRIMARY KEY,
  enforce_location BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);
INSERT INTO public.system_settings (id, enforce_location) VALUES (1, true) ON CONFLICT (id) DO NOTHING;`
                    ) : (
                      `ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Complete Access" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);`
                    )}
                  </div>
                  <p className="text-[8px] font-black text-slate-500 italic uppercase">
                    NOTE: The switch above will still work in this session even if not saved to the database.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header Controls */}
      <div className="bento-box space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <ShieldCheck size={24} className="text-bento-accent" />
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-bento-ink">Privilege Management</h2>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="btn-primary px-8 py-3 text-[10px] font-black tracking-widest uppercase flex items-center space-x-2"
          >
            <UserPlus size={14} />
            <span>AUTHORIZE NEW ACCESS</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-bento-bg">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH BY NAME, USERNAME OR EMAIL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-bento-bg/30 border border-bento-line text-[10px] font-bold uppercase focus:outline-hidden focus:ring-1 focus:ring-bento-ink h-[44px]"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={14} />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-bento-bg/30 border border-bento-line text-[10px] font-black uppercase focus:outline-hidden focus:ring-1 focus:ring-bento-ink h-[44px] appearance-none"
            >
              <option value="all">ALL ROLES</option>
              <option value="admin">ADMINS</option>
              <option value="mudeer">MUDEERS</option>
              <option value="user">USER</option>
            </select>
          </div>

          <div className="relative">
            <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={14} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-bento-bg/30 border border-bento-line text-[10px] font-black uppercase focus:outline-hidden focus:ring-1 focus:ring-bento-ink h-[44px] appearance-none"
            >
              <option value="all">ALL STATUS</option>
              <option value="active">ACTIVE ONLY</option>
              <option value="locked">LOCKED ONLY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modern Table Layout */}
      <div className="bento-box p-0 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-bento-ink text-white">
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-left border-r border-white/10">ID</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-left border-r border-white/10">Identity</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-left border-r border-white/10">Credentials</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-left border-r border-white/10">Hub & Tier</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-center border-r border-white/10">Status</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-center">Protocol Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bento-line">
              {filteredUsers.map((u, idx) => (
                <tr key={`${u.id}-${idx}`} className="hover:bg-bento-bg/20 transition-colors group">
                  <td className="px-4 py-4 border-r border-bento-line">
                    <span className="font-mono text-[10px] font-black text-bento-ink/40 tracking-tighter">{u.id}</span>
                  </td>
                  <td className="px-4 py-4 border-r border-bento-line">
                    <div>
                      <div className="text-xs font-black uppercase text-bento-ink leading-tight">{u.name}</div>
                      <div className="text-[9px] font-mono text-bento-ink opacity-40 lowercase">{u.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-r border-bento-line">
                    <div className="space-y-1">
                      <div className="flex items-center text-[10px] text-bento-ink font-bold">
                        <span className="opacity-40 uppercase mr-1.5 w-6">UID:</span>
                        <span className="font-black bg-bento-bg px-1.5 py-0.5 border border-bento-line">{u.username}</span>
                      </div>
                      <div className="flex items-center text-[10px] text-bento-ink font-bold">
                        <span className="opacity-40 uppercase mr-1.5 w-6">PX:</span>
                        <div className="flex items-center bg-bento-bg px-1.5 py-0.5 border border-bento-line">
                          <span className="font-mono mr-2">{showPasswords[u.id] ? u.password : '••••••'}</span>
                          <button 
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="text-bento-ink/40 hover:text-bento-ink"
                          >
                            {showPasswords[u.id] ? <EyeOff size={10} /> : <Eye size={10} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-r border-bento-line">
                    <div className="space-y-1">
                      <div className="text-[9px] font-black uppercase text-bento-ink/60">{u?.campus || 'GLOBAL'}</div>
                      <div className="flex items-center">
                        <span className={cn(
                          "text-[8px] font-black uppercase px-1.5 py-0.5 border",
                          u.role === 'admin' ? "bg-red-50 text-red-600 border-red-200" :
                          u.role === 'mudeer' ? "bg-amber-50 text-amber-600 border-amber-200" :
                          "bg-bento-accent/10 text-bento-accent border-bento-accent/20"
                        )}>
                          {u.role}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center border-r border-bento-line">
                    <span className={cn(
                      "text-[8px] font-black uppercase px-2 py-1 tracking-widest",
                      u.accountLocked 
                        ? "bg-red-100 text-red-600 border border-red-200" 
                        : "bg-green-100 text-green-600 border border-green-200"
                    )}>
                      {u.accountLocked ? 'LOCKED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleToggleLock(u)}
                        title={u.accountLocked ? "Authorize (Unlock)" : "Restrain (Lock)"}
                        className={cn(
                          "p-2 border transition-all h-[32px] w-[32px] flex items-center justify-center",
                          u.accountLocked 
                            ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100" 
                            : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                        )}
                      >
                        {u.accountLocked ? <Unlock size={12} /> : <Lock size={12} />}
                      </button>
                      <button 
                        onClick={() => handleResetPassword(u)}
                        title="Reset Encryption"
                        className="p-2 border border-bento-line text-bento-ink hover:bg-bento-bg h-[32px] w-[32px] flex items-center justify-center"
                      >
                        <Key size={12} />
                      </button>
                      <button 
                        onClick={() => handleOpenCloneModal(u)}
                        title="Duplicate Identity"
                        className="p-2 border border-bento-line text-bento-ink hover:bg-bento-bg h-[32px] w-[32px] flex items-center justify-center"
                      >
                        <Copy size={12} />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(u)}
                        title="Modify Profile"
                        className="p-2 border border-bento-line text-bento-ink hover:bg-bento-bg h-[32px] w-[32px] flex items-center justify-center"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        title="Revoke Permission"
                        className="p-2 border border-red-200 text-red-600 hover:bg-red-50 h-[32px] w-[32px] flex items-center justify-center"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-bento-bg rounded-full mb-4">
              <Search size={24} className="text-bento-ink/20" />
            </div>
            <h4 className="text-xs font-black uppercase text-bento-ink/40 tracking-widest">No matching agents found in secure registry</h4>
          </div>
        )}
      </div>

      {/* User Auth Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-bento-ink/90 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bento-box bg-white max-w-xl w-full p-0 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-bento-ink p-6 text-white flex items-center justify-between border-b-[4px] border-bento-accent">
              <div className="flex items-center space-x-3">
                <ShieldAlert size={24} className="text-bento-accent" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em]">
                  {editingUser ? 'Profile Upgrade Protocol' : 'Identity Creation Sequence'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="opacity-40 hover:opacity-100 transition-opacity">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-3 gap-6 items-end">
                <div className="col-span-1">
                  <label className="block text-[9px] font-black text-bento-ink uppercase tracking-widest mb-2 opacity-40">System ID</label>
                  <input 
                    readOnly
                    type="text" 
                    value={formData.id}
                    className="w-full px-4 py-3 bg-bento-bg border border-bento-line text-[10px] font-mono font-black text-bento-ink/40 focus:outline-hidden h-[44px]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-black text-bento-ink uppercase tracking-widest mb-2 opacity-40">Personnel Designation (Full Name)</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-[10px] font-black uppercase h-[44px] focus:ring-1 focus:ring-bento-ink focus:outline-hidden"
                    placeholder="ENTER FULL NAME..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[9px] font-black text-bento-ink uppercase tracking-widest mb-2 opacity-40">System Username</label>
                  <input 
                    required
                    type="text" 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase()})}
                    className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-[10px] font-black lowercase h-[44px] focus:ring-1 focus:ring-bento-ink focus:outline-hidden"
                    placeholder="USERNAME"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-bento-ink uppercase tracking-widest mb-2 opacity-40">Encryption Hash (Password)</label>
                  <div className="relative">
                    <input 
                      required
                      type={showPasswords['modal'] ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-[10px] font-black h-[44px] focus:ring-1 focus:ring-bento-ink focus:outline-hidden"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => togglePasswordVisibility('modal')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bento-ink/40 hover:text-bento-ink"
                    >
                      {showPasswords['modal'] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-bento-ink uppercase tracking-widest mb-2 opacity-40">Electronic Mail (Email)</label>
                <input 
                  type="email" 
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-[10px] font-black h-[44px] focus:ring-1 focus:ring-bento-ink focus:outline-hidden"
                  placeholder="name@fiqhacademy.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[9px] font-black text-bento-ink uppercase tracking-widest mb-2 opacity-40">Campus Territory</label>
                  <select 
                    value={formData.campus}
                    onChange={(e) => setFormData({...formData, campus: e.target.value as CampusCode})}
                    className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-[10px] font-black uppercase h-[44px] focus:ring-1 focus:ring-bento-ink focus:outline-hidden appearance-none"
                  >
                    <option value="Main Campus">MAIN COMPLEX</option>
                    <option value="Johar Campus">JOHAR FACILITY</option>
                    <option value="Masjid Campus">MASJID GROUNDS</option>
                    <option value="Maktab Campus">MAKTAB STATION</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-bento-ink uppercase tracking-widest mb-2 opacity-40">Privilege Tier</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                    className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-[10px] font-black uppercase h-[44px] focus:ring-1 focus:ring-bento-ink focus:outline-hidden appearance-none"
                  >
                    <option value="admin">ROOT ADMIN (TIER I)</option>
                    <option value="mudeer">MUDEER (TIER II)</option>
                    <option value="user">TERMINAL USER (TIER III)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-bento-bg/30 border border-bento-line">
                <input 
                  type="checkbox"
                  id="lock-toggle"
                  checked={formData.accountLocked}
                  onChange={(e) => setFormData({...formData, accountLocked: e.target.checked})}
                  className="w-4 h-4 accent-bento-accent"
                />
                <label htmlFor="lock-toggle" className="text-[10px] font-black uppercase tracking-widest text-bento-ink cursor-pointer">
                  Impose Account Restriction (Lock)
                </label>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 border border-bento-line text-[10px] font-black uppercase tracking-widest hover:bg-bento-bg transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 btn-primary text-[10px] font-black tracking-[0.2em] uppercase flex items-center justify-center space-x-2"
                >
                  <Check size={16} />
                  <span>{editingUser ? 'SYNCHRONIZE' : 'INITIALIZE'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clone Identity Modal */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-bento-ink/95 backdrop-blur-md animate-in fade-in"
            onClick={() => setIsCloneModalOpen(false)}
          ></div>
          <div className="relative bento-box bg-white max-w-md w-full p-0 overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <div className="bg-bento-accent p-6 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Copy size={20} />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Cloning Sequence Initialized</h3>
              </div>
              <button onClick={() => setIsCloneModalOpen(false)} className="opacity-60 hover:opacity-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCloneSubmit} className="p-8 space-y-6">
              <div className="p-4 bg-bento-bg border border-bento-line rounded-sm">
                <div className="text-[8px] font-black text-bento-ink/40 uppercase mb-1">Source DNA</div>
                <div className="text-[10px] font-black text-bento-ink uppercase">{(formData.name || '').replace(' (Copy)', '')}</div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-bento-ink uppercase tracking-widest mb-2">Clone Designation</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-[10px] font-black uppercase h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-bento-ink uppercase tracking-widest mb-2">New Access Key (Username)</label>
                <input 
                  required
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase()})}
                  className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-[10px] font-black h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-bento-ink uppercase tracking-widest mb-2">New Encryption Code (Password)</label>
                <input 
                  required
                  type="text" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-[10px] font-black h-[44px]"
                  placeholder="NEW PASSWORD..."
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-4 bg-bento-accent text-white text-[10px] font-black tracking-[0.3em] uppercase flex items-center justify-center space-x-2 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] transition-all"
                >
                  <Plus size={16} />
                  <span>GENERATE CLONE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

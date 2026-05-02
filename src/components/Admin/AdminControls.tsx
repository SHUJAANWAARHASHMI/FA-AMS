
import React, { useState } from 'react';
import { User, CampusCode, UserRole } from '../../types';
import { ShieldCheck, UserPlus, Search, Edit2, Trash2, Key, X, Check, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AdminControlsProps {
  users: User[];
  user: User;
  onUpdateUsers: (users: User[]) => void;
}

export const AdminControls: React.FC<AdminControlsProps> = ({ users, user, onUpdateUsers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<User>({
    username: '',
    password: '',
    name: '',
    campus: 'Main Campus',
    role: 'user'
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (u?: User) => {
    if (u) {
      setEditingUser(u);
      setFormData(u);
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        name: '',
        campus: 'Main Campus',
        role: 'user'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUsers(users.map(u => u.username === editingUser.username ? formData : u));
    } else {
      if (users.find(u => u.username === formData.username)) {
        alert('Username already exists!');
        return;
      }
      onUpdateUsers([...users, formData]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (username: string) => {
    if (username === user.username) {
      alert('Cannot delete your own account!');
      return;
    }
    if (confirm('Are you sure you want to delete this administrative user?')) {
      onUpdateUsers(users.filter(u => u.username !== username));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bento-box flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH SYSTEM PRIVILEGES..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold uppercase focus:outline-hidden focus:ring-1 focus:ring-bento-ink"
            />
          </div>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="btn-accent px-8 py-3 text-[10px] font-black tracking-widest uppercase flex items-center space-x-2"
        >
          <UserPlus size={14} />
          <span>AUTHORIZE NEW USER</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(u => (
          <div key={u.username} className="bento-box flex flex-col group relative overflow-hidden transition-all hover:border-bento-accent">
            <div className={cn(
              "absolute top-0 right-0 px-3 py-1 text-[8px] font-black uppercase tracking-widest border-l border-b border-bento-line",
              u.role === 'admin' ? "bg-red-500 text-white" : u.role === 'mudeer' ? "bg-amber-500 text-white" : "bg-bento-accent text-white"
            )}>
              {u.role}
            </div>
            
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-bento-bg border border-bento-line flex items-center justify-center text-bento-ink/40 group-hover:bg-bento-accent group-hover:text-white transition-colors">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-black text-bento-ink uppercase tracking-tight">{u.name}</h4>
                <p className="text-[10px] font-mono font-bold text-bento-ink/40 uppercase tracking-widest">UID: {u.username}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8 font-mono">
              <div className="flex justify-between items-center text-[10px]">
                <span className="opacity-40 font-bold uppercase">TERMINAL ACCESS</span>
                <span className="font-black text-bento-ink uppercase">{u.campus} COMPLEX</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="opacity-40 font-bold uppercase">SECURITY RANK</span>
                <span className="font-black text-bento-accent uppercase tracking-widest">TIER {u.role === 'admin' ? 'I' : u.role === 'mudeer' ? 'II' : 'III'}</span>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-bento-bg flex items-center space-x-2">
              <button 
                onClick={() => handleOpenModal(u)}
                className="flex-1 py-3 bg-bento-bg text-bento-ink border border-bento-line text-[10px] font-black uppercase tracking-widest hover:bg-bento-ink hover:text-white transition-all flex items-center justify-center space-x-2"
              >
                <Edit2 size={12} />
                <span>MODIFY</span>
              </button>
              <button 
                onClick={() => handleDelete(u.username)}
                className="py-3 px-4 border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-bento-ink/80 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bento-box bg-white max-w-lg w-full p-0 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-bento-ink p-8 text-white flex items-center justify-between border-b-[4px] border-bento-accent">
              <div className="flex items-center space-x-3">
                <ShieldAlert size={28} className="text-bento-accent" />
                <h3 className="text-sm font-black uppercase tracking-[0.3em]">Security Authorization</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="opacity-40 hover:opacity-100 transition-opacity">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div>
                <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest mb-2 opacity-40">Personnel Designation</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold uppercase focus:ring-1 focus:ring-bento-ink focus:outline-hidden"
                  placeholder="EX: MAULANA OSAMA"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest mb-2 opacity-40">Access Key</label>
                  <input 
                    required
                    disabled={!!editingUser}
                    type="text" 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold uppercase focus:ring-1 focus:ring-bento-ink focus:outline-hidden disabled:opacity-30"
                    placeholder="SYSTEM ID"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest mb-2 opacity-40">Encryption Hash</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={14} />
                    <input 
                      required
                      type="password" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold placeholder:opacity-20 focus:ring-1 focus:ring-bento-ink focus:outline-hidden"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest mb-2 opacity-40">Hub Mapping</label>
                  <select 
                    value={formData.campus}
                    onChange={(e) => setFormData({...formData, campus: e.target.value as CampusCode})}
                    className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-[10px] font-black uppercase focus:ring-1 focus:ring-bento-ink focus:outline-hidden appearance-none"
                  >
                    <option value="Main Campus">Main Complex</option>
                    <option value="Johar Campus">Johar Facility</option>
                    <option value="Masjid Campus">Masjid Grounds</option>
                    <option value="Maktab Campus">Maktab Station</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest mb-2 opacity-40">Operational Tier</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                    className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-[10px] font-black uppercase focus:ring-1 focus:ring-bento-ink focus:outline-hidden appearance-none"
                  >
                    <option value="user">Terminal User (Tier III)</option>
                    <option value="mudeer">Mudeer (Tier II)</option>
                    <option value="admin">Root Admin (Tier I)</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 btn-primary text-[10px] font-black tracking-[0.3em] uppercase flex items-center justify-center space-x-3 transition-transform active:scale-95"
              >
                <Check size={18} />
                <span>{editingUser ? 'INITIALIZE UPDATE' : 'COMMIT CREDENTIALS'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

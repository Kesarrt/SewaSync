import React, { useState, useEffect } from 'react';
import { Palette, Shield, User, LogOut, CheckCircle } from 'lucide-react';
import { updateProfile, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  
  // States
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'ocean');
  // Need to ensure auth.currentUser is available, or use empty string fallback
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      setDisplayName(auth.currentUser.displayName || '');
    }
  }, [auth.currentUser]);

  // Themes list
  const themes = [
    { id: 'ocean', name: 'Ocean Air', color: 'bg-blue-500', desc: 'Crisp blue and white' },
    { id: 'midnight', name: 'Midnight', color: 'bg-slate-900', desc: 'Dark / Black mode' },
    { id: 'pastel', name: 'Pastel Dream', color: 'bg-fuchsia-300', desc: 'Soft pinks & purples' },
    { id: 'forest', name: 'Deep Forest', color: 'bg-emerald-600', desc: 'Earthy greens' },
  ];

  // Part 1: Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Part 3: Profile Management
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      setIsSaving(true);
      await updateProfile(auth.currentUser, { displayName });
      alert("✅ Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // Part 2: Security - Forgot Password
  const handleResetPassword = async () => {
    if (!auth.currentUser?.email) return;
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      alert("📧 Password reset link sent to your email!\n\nNote: Please check your Spam folder if you don't see the reset email within 2 minutes.");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to send password reset email.");
    }
  };

  // Part 2: Security - Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-theme-base p-6 md:p-12 font-sans text-theme-text transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your appearance and account security.</p>
        </div>

        {/* 1. Theme Engine */}
        <section className="bg-theme-surface p-8 rounded-[2.5rem] shadow-sm border border-slate-100/30 hover:border-theme-primary transition-colors duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-indigo-50 text-indigo-500 p-4 rounded-2xl shadow-inner">
              <Palette size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-theme-text">Appearance</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Theme Engine</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {themes.map(t => (
              <button 
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`relative flex flex-col items-center p-5 rounded-2xl border-2 transition-all ${
                  theme === t.id 
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-md transform -translate-y-1' 
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                {theme === t.id && (
                  <div className="absolute top-2 right-2 text-indigo-500 animate-in zoom-in duration-300">
                    <CheckCircle size={18} />
                  </div>
                )}
                <div className={`w-14 h-14 rounded-full mb-4 shadow-inner ring-4 ring-white ${t.color}`}></div>
                <h3 className="font-bold text-theme-text text-sm">{t.name}</h3>
                <p className="text-[10px] text-slate-500 font-medium text-center mt-1">{t.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 3. Profile Management */}
        <section className="bg-theme-surface p-8 rounded-[2.5rem] shadow-sm border border-slate-100/30 hover:border-emerald-100 transition-colors duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-emerald-50 text-emerald-500 p-4 rounded-2xl shadow-inner">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-theme-text">Personal Details</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Public Profile</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-black tracking-widest uppercase text-slate-400 mb-2">Display Name</label>
              <input 
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl px-5 py-4 outline-none transition-all font-bold text-slate-700" 
                placeholder="E.g. Jane Doe"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-4 rounded-xl transition-all w-full md:w-fit shadow-lg shadow-emerald-200"
            >
              {isSaving ? "Saving..." : "Update Profile"}
            </button>
          </form>
        </section>

        {/* 2. Account Security */}
        <section className="bg-theme-surface p-8 rounded-[2.5rem] shadow-sm border border-slate-100/30 relative overflow-hidden group hover:border-rose-100 transition-colors duration-300">
          <div className="absolute left-0 top-0 w-1.5 h-full bg-rose-500"></div>
          
          <div className="flex items-center gap-4 mb-8 pl-4">
            <div className="bg-rose-50 text-rose-500 p-4 rounded-2xl shadow-inner group-hover:scale-105 transition-transform">
              <Shield size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-theme-text">Access & Security</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 text-rose-500">Danger Zone</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 pl-4">
            <button 
              onClick={handleResetPassword}
              className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
               Send Password Reset
            </button>
            <button 
              onClick={handleSignOut}
              className="flex-1 bg-rose-100 hover:bg-rose-600 text-rose-600 hover:text-white font-black py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <LogOut size={18} className="currentColor"/> Sign Out
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

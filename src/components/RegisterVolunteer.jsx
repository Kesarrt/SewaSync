import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { User, MapPin, Mail, Sparkles, CheckCircle, Lock } from 'lucide-react';
import { sendApplicationReceivedEmail } from '../emailService';

export default function RegisterVolunteer() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    location: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // 2. Set Doc with UID
      await setDoc(doc(db, 'volunteers', user.uid), {
        name: formData.name,
        email: formData.email,
        location: formData.location,
        status: 'pending',
        role: 'volunteer',
        createdAt: serverTimestamp()
      });

      // 3. Immediately sign out pending user
      await signOut(auth);
      alert('Registration successful! Please wait for Admin approval.');

      // Send the automated notification!
      try {
        await sendApplicationReceivedEmail(formData.email, formData.name);
      } catch (emailError) {
        // We log the error but don't stop the UI success flow 
        // in case the user hasn't configured EmailJS keys yet
        console.warn("Email dispatch skipped or failed:", emailError);
      }

      // Show success state and clear form
      setIsSuccess(true);
      setFormData({ name: '', email: '', location: '' });
      
      // Reset success state after a few seconds or allow manual reset
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      console.error('Error registering volunteer:', err);
      setError('Unable to submit registration. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-theme-base min-h-screen flex items-center justify-center p-6 transition-colors duration-300">
        <div className="bg-theme-surface max-w-md w-full p-10 rounded-[2.5rem] shadow-xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-500 border border-slate-100/10">
          <div className="bg-emerald-500/10 p-6 rounded-full mb-6">
            <CheckCircle className="text-emerald-500 w-16 h-16" />
          </div>
          <h2 className="text-2xl font-black text-theme-text mb-3">Application Received!</h2>
          <p className="text-theme-text opacity-70 font-medium leading-relaxed mb-8">
            Thank you for stepping up to help the community. Our administrative team will review your application and get back to you shortly.
          </p>
          <button 
            onClick={() => setIsSuccess(false)}
            className="w-full bg-theme-primary text-white font-black py-4 rounded-2xl hover:brightness-110 transition-colors shadow-lg shadow-theme-primary/30 uppercase tracking-widest text-xs"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-base min-h-screen flex items-center justify-center p-6 lg:py-16 transition-colors duration-300">
      <div className="bg-theme-surface max-w-md w-full p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100/5">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex bg-theme-primary/10 p-4 rounded-2xl mb-4 text-theme-primary">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-theme-text mb-2">Join SewaSync</h2>
          <p className="text-theme-text opacity-50 font-bold uppercase tracking-widest text-[10px]">Sign up as a community volunteer</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-2xl text-sm font-black tracking-wide border border-red-500/20 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-[10px] uppercase font-black text-theme-text opacity-70 ml-2 tracking-widest">Full Name</label>
            <div className="relative">
              <input 
                id="name" type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="E.g. Emma Watson"
                className="w-full bg-theme-base border border-slate-200/10 focus:border-theme-primary text-theme-text pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-theme-primary/10 transition-all font-bold"
              />
              <User className="absolute left-4 top-4 text-theme-text opacity-40 w-5 h-5" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[10px] uppercase font-black text-theme-text opacity-70 ml-2 tracking-widest">Email Address</label>
            <div className="relative">
              <input 
                id="email" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="emma@example.com"
                className="w-full bg-theme-base border border-slate-200/10 focus:border-theme-primary text-theme-text pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-theme-primary/10 transition-all font-bold"
              />
              <Mail className="absolute left-4 top-4 text-theme-text opacity-40 w-5 h-5" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[10px] uppercase font-black text-theme-text opacity-70 ml-2 tracking-widest">Password</label>
            <div className="relative">
              <input 
                id="password" type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••"
                className="w-full bg-theme-base border border-slate-200/10 focus:border-theme-primary text-theme-text pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-theme-primary/10 transition-all font-bold"
              />
              <Lock className="absolute left-4 top-4 text-theme-text opacity-40 w-5 h-5" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="location" className="text-[10px] uppercase font-black text-theme-text opacity-70 ml-2 tracking-widest">Geographical Sector</label>
            <div className="relative">
              <input 
                id="location" type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="North District"
                className="w-full bg-theme-base border border-slate-200/10 focus:border-theme-primary text-theme-text pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-theme-primary/10 transition-all font-bold"
              />
              <MapPin className="absolute left-4 top-4 text-theme-text opacity-40 w-5 h-5" />
            </div>
          </div>

          <button 
            type="submit" disabled={isSubmitting}
            className="mt-4 w-full bg-theme-primary text-white font-black py-4 rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-theme-primary/30 flex justify-center items-center gap-2 disabled:bg-slate-500 disabled:shadow-none uppercase tracking-widest text-xs"
          >
            {isSubmitting ? 'Transmitting Data...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

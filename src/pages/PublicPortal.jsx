import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Heart, Send, Globe, CheckCircle, Users, Activity, Target, ArrowRight } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function PublicPortal() {
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [recentWork, setRecentWork] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'recentWork'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setRecentWork(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        name: formData.name,
        phone: formData.phone,
        message: formData.message,
        createdAt: serverTimestamp()
      });
      
      setStatus('success');
      setFormData({ name: '', phone: '', message: '' });
      setTimeout(() => setStatus('idle'), 4000);
    } catch (error) {
      console.error("Error sending message:", error);
      setStatus('error');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans">
      
      {/* 1. Navbar */}
      <nav className="bg-white py-5 px-8 shadow-sm flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-indigo-600 text-white p-2.5 rounded-xl">
            <Globe size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">Sewa<span className="text-indigo-600">Sync</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-slate-600 font-bold hover:text-indigo-600 transition-colors px-4 py-2">
            Login
          </Link>
          <Link to="/join" className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
            Join as Volunteer
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-12 flex flex-col gap-16">
        
        {/* 2. Hero Section */}
        <section className="text-center pt-10 pb-6">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            Empowering Communities,<br/><span className="text-indigo-600">Together.</span>
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            SewaSync coordinates real-time emergency response and community relief operations by connecting local heroes with those in need.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/join" className="bg-indigo-600 text-white font-black px-8 py-4 rounded-full text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:-translate-y-1 flex items-center gap-2">
              Start Volunteering <ArrowRight size={20} />
            </Link>
          </div>
        </section>

        {/* 3. Impact Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:border-indigo-100 transition-colors">
            <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform"><Users size={32} /></div>
            <h3 className="text-4xl font-black text-slate-800">1,240+</h3>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs mt-2">Active Volunteers</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:border-teal-100 transition-colors">
            <div className="bg-teal-50 text-teal-600 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform"><Target size={32} /></div>
            <h3 className="text-4xl font-black text-slate-800">150+</h3>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs mt-2">Missions Completed</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:border-amber-100 transition-colors">
            <div className="bg-amber-50 text-amber-600 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform"><Activity size={32} /></div>
            <h3 className="text-4xl font-black text-slate-800">24/7</h3>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs mt-2">Emergency Response</p>
          </div>
        </section>

        {/* 4. Recent Work Gallery (Dynamic) */}
        <section className="pt-8">
          <div className="flex items-center gap-3 mb-10 justify-center">
            <Heart className="text-rose-500" size={32} />
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Our Recent Impact</h2>
          </div>
          
          {recentWork.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-slate-500 font-medium">No recent work published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recentWork.map((work) => (
                <div key={work.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col hover:-translate-y-1">
                  <div className="h-56 w-full overflow-hidden relative">
                    <img 
                      src={work.imageUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                      alt={work.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1593113511332-9cbca45b4b1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
                    />
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-xl font-black text-slate-800 mb-3 leading-tight">{work.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">{work.description}</p>
                    <button className="mt-auto text-indigo-600 font-bold text-sm hover:text-indigo-800 flex items-center gap-1 group/btn">
                      Read Details <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Contact Form connected to Firestore */}
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-10 md:p-14 mt-10 max-w-4xl mx-auto w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-3">Get in Touch</h2>
            <p className="text-slate-500 font-medium">Want to partner with us or need non-emergency assistance?</p>
          </div>
          
          {status === 'success' && (
            <div className="mb-8 bg-emerald-50 text-emerald-800 p-5 rounded-2xl flex items-start gap-3 border border-emerald-100 animate-in fade-in zoom-in duration-300">
              <CheckCircle className="text-emerald-500 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold">Message Sent Successfully!</h4>
                <p className="text-sm mt-1 text-emerald-700">Thank you. An administrator will review your message shortly.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-black tracking-widest uppercase text-slate-400 mb-2">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Jane Doe" 
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 focus:bg-white transition-all font-medium text-slate-700" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-black tracking-widest uppercase text-slate-400 mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+1 (555) 000-0000" 
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 focus:bg-white transition-all font-medium text-slate-700" 
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-black tracking-widest uppercase text-slate-400 mb-2">Message</label>
              <textarea 
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="4" 
                placeholder="How can we help?" 
                className="w-full px-5 py-4 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 focus:bg-white transition-all font-medium text-slate-700 resize-none"
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              disabled={status === 'submitting'}
              className="bg-slate-900 text-white py-4 rounded-full font-black hover:bg-slate-800 transition-colors shadow-lg flex justify-center items-center gap-2 mt-4 disabled:bg-slate-400"
            >
              <Send size={18} />
              {status === 'submitting' ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </section>

      </main>
    </div>
  );
}

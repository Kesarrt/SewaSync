import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Heart, Send, Globe, CheckCircle, Users, Activity, Target, ArrowRight, X } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function PublicPortal() {
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [recentWork, setRecentWork] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
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
    <div className="bg-theme-base min-h-screen pb-20 font-sans transition-colors duration-300">

      {/* 1. Navbar */}
      <nav className="bg-theme-surface py-5 px-8 shadow-sm flex justify-between items-center sticky top-0 z-50 transition-colors duration-300 border-b border-slate-200/10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-theme-primary text-white p-2.5 rounded-xl">
            <Globe size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-theme-text">Sewa<span className="text-theme-primary">Sync</span></h1>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-theme-text opacity-70 font-bold hover:opacity-100 hover:text-theme-primary transition-all px-4 py-2">
            Login
          </Link>
          <Link to="/join" className="bg-theme-primary text-white font-bold px-6 py-3 rounded-full hover:brightness-110 transition-all shadow-lg shadow-theme-primary/30">
            Join as Volunteer
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-12 flex flex-col gap-16">

        {/* 2. Hero Section */}
        <section className="text-center pt-10 pb-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl md:text-7xl font-black text-theme-text tracking-tight leading-tight mb-6">
            Empowering Communities,<br /><span className="text-theme-primary">Together.</span>
          </h1>
          <p className="text-xl text-theme-text opacity-70 mb-10 max-w-2xl mx-auto leading-relaxed">
            SewaSync coordinates real-time emergency response and community relief operations by connecting local heroes with those in need.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/join" className="bg-theme-primary text-white font-black px-8 py-4 rounded-full text-lg hover:brightness-110 transition-all shadow-xl shadow-theme-primary/30 hover:-translate-y-1 flex items-center gap-2">
              Start Volunteering <ArrowRight size={20} />
            </Link>
          </div>
        </section>

        {/* 3. Impact Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-theme-surface p-8 rounded-[2rem] shadow-sm border border-slate-200/10 flex flex-col items-center text-center group hover:border-indigo-500/30 transition-colors duration-300">
            <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform"><Users size={32} /></div>
            <h3 className="text-4xl font-black text-theme-text">1,240+</h3>
            <p className="text-theme-text opacity-50 font-black uppercase tracking-widest text-xs mt-2">Active Volunteers</p>
          </div>
          <div className="bg-theme-surface p-8 rounded-[2rem] shadow-sm border border-slate-200/10 flex flex-col items-center text-center group hover:border-teal-500/30 transition-colors duration-300">
            <div className="bg-teal-50 text-teal-600 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform"><Target size={32} /></div>
            <h3 className="text-4xl font-black text-theme-text">150+</h3>
            <p className="text-theme-text opacity-50 font-black uppercase tracking-widest text-xs mt-2">Missions Completed</p>
          </div>
          <div className="bg-theme-surface p-8 rounded-[2rem] shadow-sm border border-slate-200/10 flex flex-col items-center text-center group hover:border-amber-500/30 transition-colors duration-300">
            <div className="bg-amber-50 text-amber-600 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform"><Activity size={32} /></div>
            <h3 className="text-4xl font-black text-theme-text">24/7</h3>
            <p className="text-theme-text opacity-50 font-black uppercase tracking-widest text-xs mt-2">Emergency Response</p>
          </div>
        </section>

        {/* 4. Recent Work Gallery (Dynamic) */}
        <section className="pt-8 relative zoom-in-95 animate-in duration-700 fade-in">
          <div className="flex items-center gap-3 mb-10 justify-center">
            <Heart className="text-rose-500" size={32} />
            <h2 className="text-3xl font-black text-theme-text tracking-tight">Our Recent Impact</h2>
          </div>

          {recentWork.length === 0 ? (
            <div className="text-center py-12 bg-theme-surface rounded-3xl shadow-sm">
              <p className="text-theme-text font-medium opacity-60">No recent work published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recentWork.map((work) => (
                <div
                  key={work.id}
                  onClick={() => setSelectedStory(work)}
                  className="bg-theme-surface rounded-[2rem] shadow-sm border border-slate-200/10 overflow-hidden hover:shadow-2xl hover:shadow-theme-primary/10 transition-all cursor-pointer group flex flex-col hover:-translate-y-2 duration-300"
                >
                  <div className="h-56 w-full overflow-hidden relative">
                    <img
                      src={work.imageUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                      alt={work.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1593113511332-9cbca45b4b1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-xl font-black text-theme-text mb-3 leading-tight">{work.title}</h3>
                    <p className="text-theme-text opacity-70 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">{work.description}</p>
                    <button className="mt-auto text-theme-primary font-black uppercase tracking-widest text-xs flex items-center gap-2 group/btn">
                      Know More <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Contact Form connected to Firestore */}
        <section className="bg-theme-surface rounded-[3rem] shadow-xl shadow-theme-primary/5 border border-slate-200/10 p-10 md:p-14 mt-10 max-w-4xl mx-auto w-full transition-colors duration-300">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-theme-text tracking-tight mb-3">Get in Touch</h2>
            <p className="text-theme-text opacity-70 font-medium">Want to partner with us or need non-emergency assistance?</p>
          </div>

          {status === 'success' && (
            <div className="mb-8 bg-emerald-50 text-emerald-800 p-5 rounded-3xl flex items-start gap-3 border border-emerald-100 animate-in fade-in zoom-in duration-300">
              <CheckCircle className="text-emerald-500 mt-1" size={24} />
              <div>
                <h4 className="font-black text-lg">Message Sent Successfully!</h4>
                <p className="text-sm mt-1 text-emerald-700 font-medium">Thank you. An administrator will review your message shortly.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-black tracking-widest uppercase text-theme-text opacity-50 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Jane Doe"
                  className="w-full px-5 py-4 border border-theme-base rounded-2xl outline-none focus:border-theme-primary focus:ring-4 focus:ring-theme-primary/10 bg-theme-base focus:bg-theme-surface transition-all font-bold text-theme-text shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black tracking-widest uppercase text-theme-text opacity-50 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-5 py-4 border border-theme-base rounded-2xl outline-none focus:border-theme-primary focus:ring-4 focus:ring-theme-primary/10 bg-theme-base focus:bg-theme-surface transition-all font-bold text-theme-text shadow-inner"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-black tracking-widest uppercase text-theme-text opacity-50 mb-2">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="4"
                placeholder="How can we help?"
                className="w-full px-5 py-4 border border-theme-base rounded-[1.5rem] outline-none focus:border-theme-primary focus:ring-4 focus:ring-theme-primary/10 bg-theme-base focus:bg-theme-surface transition-all font-bold text-theme-text resize-none shadow-inner"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="bg-theme-text text-theme-base py-5 rounded-2xl font-black hover:opacity-80 transition-opacity shadow-xl flex justify-center items-center gap-2 mt-4 disabled:opacity-50 uppercase tracking-widest"
            >
              <Send size={18} />
              {status === 'submitting' ? 'Sending Protocol...' : 'Send Communication'}
            </button>
          </form>
        </section>

      </main>

      {/* 5. The Detail Modal (The Popup) */}
      {selectedStory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">

          {/* Modal Container */}
          <div className="bg-theme-base w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">

            {/* Close Button */}
            <button
              onClick={() => setSelectedStory(null)}
              className="absolute top-6 right-6 z-20 bg-black/30 backdrop-blur-xl text-white p-3 rounded-full hover:bg-black/50 hover:scale-110 transition-all shadow-lg"
            >
              <X size={24} />
            </button>

            {/* Banner Image */}
            <div className="w-full h-64 md:h-96 relative shrink-0">
              <img
                src={selectedStory.imageUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"}
                alt={selectedStory.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1593113511332-9cbca45b4b1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-theme-base to-transparent" />
            </div>

            {/* Modal Content Payload */}
            <div className="p-8 md:p-12 overflow-y-auto w-full -mt-20 z-10 relative">
              <div className="bg-theme-surface shadow-2xl rounded-3xl p-8 md:p-12 border border-slate-200/10">
                <h2 className="text-3xl md:text-5xl font-black text-theme-text mb-6 leading-tight tracking-tight">
                  {selectedStory.title}
                </h2>

                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-theme-primary mb-10 pb-6 border-b border-theme-base">
                  <Heart size={14} className="animate-pulse" /> Impact Report
                </div>

                <div className="prose prose-lg prose-slate max-w-none text-theme-text opacity-90 leading-relaxed font-medium">
                  {selectedStory.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-6">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react'
import { AlertCircle, Heart, Send, Globe, CheckCircle } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export default function PublicPortal() {
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' })
  const [status, setStatus] = useState('idle')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('submitting')
    
    try {
      // Adding the contact form submission to a 'messages' collection
      // (It's better practice to keep contact messages separate from the 'volunteers' collection)
      const messagesRef = collection(db, 'messages')
      await addDoc(messagesRef, {
        name: formData.name,
        phone: formData.phone,
        message: formData.message,
        createdAt: serverTimestamp()
      })
      
      setStatus('success')
      setFormData({ name: '', phone: '', message: '' })
      setTimeout(() => setStatus('idle'), 4000)
    } catch (error) {
      console.error("Error sending message:", error)
      setStatus('error')
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Public Header */}
      <header className="bg-brand-navy text-white py-6 px-8 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Globe className="text-brand-teal" size={28} />
          <h1 className="text-2xl font-bold tracking-wide">Sewa Sync Community</h1>
        </div>
        <p className="text-sm text-slate-300 hidden md:block">Real-time NGO Resource Allocation Platform</p>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-10 flex flex-col gap-12">
        
        {/* Emergency Section */}
        <section className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-xl overflow-hidden text-white p-8 md:p-10 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-20 translate-x-10 pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="bg-white/20 p-5 rounded-full animate-pulse">
              <AlertCircle size={48} className="text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold mb-2">Emergency Request / SOS</h2>
              <p className="text-red-100 text-lg mb-6">If you or your community are facing an immediate crisis, notify our fast-response volunteers right now.</p>
              <button className="bg-white text-red-600 font-bold px-8 py-3 rounded-full hover:bg-slate-100 transition-colors shadow-lg flex items-center justify-center gap-2 mx-auto md:mx-0">
                <AlertCircle size={20} />
                Broadcast Emergency
              </button>
            </div>
          </div>
        </section>

        {/* Impact Gallery */}
        <section>
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Heart className="text-brand-teal" size={28} />
            <h2 className="text-3xl font-bold text-brand-navy">Our Recent Work</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ImpactCard 
              image="bg-indigo-300" 
              title="Flood Relief 2026" 
              desc="Dispatched 150 volunteers to distribute medical supplies and emergency rations to North District." 
            />
            <ImpactCard 
              image="bg-teal-300" 
              title="Education Drive" 
              desc="Constructed temporary learning centers for 500 displaced students over the last weekend." 
            />
            <ImpactCard 
              image="bg-slate-300" 
              title="Community Kitchen" 
              desc="Successfully operated a 24/7 kitchen supplying hot meals to frontline workers." 
            />
          </div>
        </section>

        {/* Contact Form connected to Firestore */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 mb-10 max-w-3xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-brand-navy mb-2 text-center">Get in Touch</h2>
          <p className="text-slate-500 mb-8 text-center">Want to partner with us or need non-emergency assistance?</p>
          
          {status === 'success' && (
            <div className="mb-6 bg-teal-50 text-teal-800 p-4 rounded-xl flex items-start gap-3 border border-teal-100">
              <CheckCircle className="text-brand-teal mt-0.5" size={18} />
              <div>
                <h4 className="font-semibold text-sm">Message Sent Successfully!</h4>
                <p className="text-xs mt-1">Thank you. An administrator will review your message shortly.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Jane Doe" 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-teal bg-slate-50 focus:bg-white transition-colors" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+1 (555) 000-0000" 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-teal bg-slate-50 focus:bg-white transition-colors" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea 
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="4" 
                placeholder="How can we help?" 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-teal bg-slate-50 focus:bg-white transition-colors"
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              disabled={status === 'submitting'}
              className="bg-brand-navy text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-md flex justify-center items-center gap-2 mt-2 disabled:bg-slate-400"
            >
              <Send size={18} />
              {status === 'submitting' ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </section>

      </main>
    </div>
  )
}

function ImpactCard({ title, desc, image }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className={`h-48 w-full ${image} flex items-center justify-center`}>
        <span className="text-slate-500/50 font-medium">Image Placeholder</span>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-brand-navy mb-2">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-4">{desc}</p>
        <button className="mt-auto text-brand-teal font-medium text-sm hover:underline self-start">Read More &rarr;</button>
      </div>
    </div>
  )
}

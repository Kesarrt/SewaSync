import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User, MapPin, Mail, Sparkles, CheckCircle } from 'lucide-react';
import { sendApplicationReceivedEmail } from '../emailService';

export default function RegisterVolunteer() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
      const volunteersRef = collection(db, 'volunteers');
      
      await addDoc(volunteersRef, {
        name: formData.name,
        email: formData.email,
        location: formData.location,
        status: 'pending',
        role: 'applicant',
        createdAt: serverTimestamp()
      });

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
      <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full p-10 rounded-3xl shadow-xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
          <div className="bg-green-100 p-6 rounded-full mb-6">
            <CheckCircle className="text-green-500 w-16 h-16" />
          </div>
          <h2 className="text-2xl font-black text-indigo-900 mb-3">Application Received!</h2>
          <p className="text-slate-500 leading-relaxed mb-8">
            Thank you for stepping up to help the community. Our administrative team will review your application and get back to you shortly.
          </p>
          <button 
            onClick={() => setIsSuccess(false)}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-3xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6 lg:py-16">
      <div className="bg-white max-w-md w-full p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex bg-indigo-50 p-4 rounded-full mb-4 text-indigo-600">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Join SewaSync</h2>
          <p className="text-slate-500 text-sm">Sign up as a community volunteer</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-3xl text-sm font-medium border border-red-100 text-center">
            {error}
          </div>
        )}

        {/* Mobile-First Single-Column Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-bold text-slate-700 ml-2">Full Name</label>
            <div className="relative">
              <input 
                id="name"
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Emma Watson"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-4 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all font-medium"
              />
              <User className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-bold text-slate-700 ml-2">Email Address</label>
            <div className="relative">
              <input 
                id="email"
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="emma@example.com"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-4 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all font-medium"
              />
              <Mail className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="location" className="text-sm font-bold text-slate-700 ml-2">City or District Location</label>
            <div className="relative">
              <input 
                id="location"
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="North District, Sector 5"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-4 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all font-medium"
              />
              <MapPin className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="mt-4 w-full bg-indigo-600 text-white font-bold py-4 rounded-3xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 flex justify-center items-center gap-2 disabled:bg-slate-400 disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Submit Application'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

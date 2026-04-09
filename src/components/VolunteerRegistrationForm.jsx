import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Import our firestore instance
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function VolunteerRegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    experience: ''
  });
  
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      // Create a reference to the 'volunteers' collection using our DB instance
      const volunteersRef = collection(db, 'volunteers');
      
      // Add a new document with the form data
      await addDoc(volunteersRef, {
        name: formData.name,
        phone: formData.phone,
        location: formData.address, // Mapping 'address' to 'location' in DB
        skills: [formData.experience], // Storing as array to match our previous table format
        status: 'Offline', // Default status for new sign-ups
        match: Math.floor(Math.random() * 20) + 70, // Mock initial score matching
        createdAt: serverTimestamp()
      });

      setStatus('success');
      
      // Reset form
      setFormData({ name: '', phone: '', address: '', experience: '' });
      
      // Reset success message after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
      
    } catch (error) {
      console.error("Error adding document: ", error);
      setErrorMessage(error.message);
      setStatus('error');
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold text-brand-navy mb-1">Join as a Volunteer</h2>
      <p className="text-slate-500 text-sm mb-6">Register below to be matched with NGOs requesting assistance in your area.</p>

      {status === 'success' && (
        <div className="mb-6 bg-teal-50 text-teal-800 p-4 rounded-xl flex items-start gap-3 border border-teal-100">
          <CheckCircle className="text-brand-teal mt-0.5" size={18} />
          <div>
            <h4 className="font-semibold text-sm">Registration Complete!</h4>
            <p className="text-xs mt-1">Thank you for joining. Our AI matches will contact you soon.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-xl flex items-start gap-3 border border-red-100">
          <AlertCircle className="text-brand-red mt-0.5" size={18} />
          <div>
            <h4 className="font-semibold text-sm">Error Saving to Database</h4>
            <p className="text-xs mt-1">{errorMessage}. Did you replace YOUR_API_KEY in firebase.js?</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all" 
            placeholder="Jane Doe"
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
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all" 
            placeholder="+1 555-0000"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Address / Location</label>
          <input 
            type="text" 
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all" 
            placeholder="North District, Sector 5"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Primary Field of Experience</label>
          <select 
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all"
          >
            <option value="" disabled>Select your primary skill...</option>
            <option value="Medical">Medical / First Aid</option>
            <option value="Logistics">Logistics & Transportation</option>
            <option value="Cooking">Food Prep & Cooking</option>
            <option value="Teaching">Education & Teaching</option>
            <option value="Counseling">Counseling & Translation</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={status === 'submitting'}
          className="mt-2 w-full bg-brand-navy text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:bg-slate-400"
        >
          {status === 'submitting' ? 'Submitting to Database...' : 'Register as Volunteer'}
        </button>
      </form>
    </div>
  );
}

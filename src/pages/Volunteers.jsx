import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Award, MapPin, Activity, User } from 'lucide-react';

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Connect to the 'volunteers' collection and filter for approved status
    const q = query(
      collection(db, 'volunteers'),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const volds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVolunteers(volds);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching volunteers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-[80vh] rounded-3xl">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Team</h1>
        <p className="text-slate-500 font-bold text-xs uppercase mt-2 flex items-center gap-1">
          <Activity size={14} className="text-indigo-600" /> {volunteers.length} Approved Volunteers
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : volunteers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <User size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No approved volunteers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {volunteers.map(vol => (
            <div 
              key={vol.id} 
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col items-center text-center relative overflow-hidden group"
            >
              {/* Top Accent Bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              {/* Status Badge */}
              <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active
              </div>

              {/* Avatar Placeholder */}
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 mt-2">
                <User size={32} className="text-indigo-300" />
              </div>

              {/* Identity Details */}
              <h3 className="text-lg font-bold text-slate-900 mb-1">{vol.name}</h3>
              
              <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4">
                <MapPin size={14} />
                <span>{vol.location || 'Location Pending'}</span>
              </div>

              {/* Stats Card */}
              <div className="bg-slate-50 w-full p-3 rounded-2xl border border-slate-100 flex items-center justify-center gap-2 mb-6">
                <Award size={16} className="text-amber-500" />
                <span className="text-xs font-bold text-slate-700">12 Tasks Completed</span>
              </div>

              {/* Action Button */}
              <button className="w-full bg-indigo-50 text-indigo-700 font-bold py-3 text-sm rounded-2xl hover:bg-indigo-600 hover:text-white transition-colors flex justify-center items-center gap-2 mt-auto">
                <Activity size={16} />
                View Activity
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

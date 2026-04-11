import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Trophy, Activity, Eye, X, MapPin, Award } from 'lucide-react';

export default function ActiveTeam() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [volunteerTasks, setVolunteerTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Part 1: The Live Leaderboard
  useEffect(() => {
    // Attempting compound query as requested
    const q = query(
      collection(db, 'volunteers'),
      where('status', '==', 'approved'),
      orderBy('credits', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setLeaderboard(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      // Graceful fallback: If Firebase compound index is not created yet, we filter and sort in JS
      if (error.code === 'failed-precondition') {
        console.warn("Missing Firestore Index. Sorting leaderboard locally.");
        const fallbackQ = query(collection(db, 'volunteers'), where('status', '==', 'approved'));
        onSnapshot(fallbackQ, (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          docs.sort((a, b) => (b.credits || 0) - (a.credits || 0));
          setLeaderboard(docs);
        });
      } else {
        console.error("Leaderboard Error:", error);
      }
    });

    return () => unsub();
  }, []);

  // Part 2: Fetch Activity on click (Click Handler)
  const handleViewActivity = async (volunteer) => {
    setSelectedVolunteer(volunteer);
    setIsLoadingTasks(true);

    try {
      const q = query(
        collection(db, 'tasks'),
        where('assignedToEmail', '==', volunteer.email),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      setVolunteerTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      // Graceful fallback if compound index is missing
      if (error.code === 'failed-precondition') {
        console.warn("Missing Firestore Index for Tasks. Doing local sort.");
        const fallbackQ = query(
          collection(db, 'tasks'),
          where('assignedToEmail', '==', volunteer.email),
          where('status', '==', 'completed')
        );
        const fallbackSnap = await getDocs(fallbackQ);
        const docs = fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setVolunteerTasks(docs);
      } else {
        console.error("Error fetching tasks:", error);
      }
    } finally {
      setIsLoadingTasks(false);
    }
  };

  return (
    <>
      <div className="bg-theme-surface transition-colors duration-300 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-full">
        <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-theme-text">
          <Trophy size={22} className="text-amber-500" /> Leaderboard
        </h2>

        {leaderboard.length === 0 ? (
          <p className="text-slate-400 text-sm italic text-center my-auto">No approved volunteers yet.</p>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {leaderboard.map((vol, index) => (
              <div 
                key={vol.id} 
                className="flex justify-between items-center p-4 bg-theme-base transition-colors duration-300/50 rounded-2xl border border-slate-100 hover:border-amber-200 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex justify-center items-center font-black text-sm
                    ${index === 0 ? 'bg-amber-100 text-amber-600' : 
                      index === 1 ? 'bg-slate-200 text-slate-600' : 
                      index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-theme-surface text-slate-400'}`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-theme-text leading-tight">{vol.name}</h3>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1 mt-0.5">
                      <Activity size={10} /> {vol.expertise || 'General'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-black text-amber-500 flex items-center justify-end gap-1">
                      {vol.credits || 0} <Award size={14} />
                    </p>
                    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Credits</p>
                  </div>
                  <button 
                    onClick={() => handleViewActivity(vol)}
                    className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                    title="View Activity"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Part 2: The 'View Activity' Modal */}
      {selectedVolunteer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-theme-surface transition-colors duration-300 max-w-lg w-full rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-theme-surface transition-colors duration-300/10 rounded-full translate-x-10 -translate-y-10 blur-2xl"></div>
              <div>
                <h2 className="text-2xl font-black racking-tight">{selectedVolunteer.name}</h2>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Mission History</p>
              </div>
              <button 
                onClick={() => setSelectedVolunteer(null)} 
                className="bg-indigo-700/50 p-2 rounded-full hover:bg-theme-surface transition-colors duration-300 hover:text-indigo-600 transition-colors z-10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-theme-base transition-colors duration-300">
              {isLoadingTasks ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin text-indigo-600"><Activity size={28} /></div>
                </div>
              ) : volunteerTasks.length === 0 ? (
                <div className="text-center py-10 bg-theme-surface transition-colors duration-300 rounded-2xl border border-slate-100 shadow-sm">
                  <Award className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-slate-500 font-medium">No completed tasks found for this volunteer yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {volunteerTasks.map((task) => (
                    <div key={task.id} className="bg-theme-surface transition-colors duration-300 p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 bg-opacity-50"></div>
                      <div className="flex justify-between items-start pl-2">
                        <div>
                          <h3 className="font-bold text-theme-text leading-tight">{task.title}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                            <MapPin size={12} className="text-slate-400"/> {task.location}
                          </p>
                        </div>
                        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 whitespace-nowrap">
                          +{task.points || 10} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, increment, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { CheckCircle, MapPin, Award, Loader2 } from 'lucide-react';

export default function VolunteerTasks() {
  const [tasks, setTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingTaskId, setCompletingTaskId] = useState(null);

  useEffect(() => {
    // 1. Authenticate user context
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user && user.email) {
        // 2. Fetch tasks assigned to this specific volunteer stringently by email
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('assignedToEmail', '==', user.email)
        );

        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
          setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLoading(false);
        });

        return () => unsubscribeTasks();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleCompleteMission = async (task) => {
    if (!currentUser || !currentUser.email) return;
    
    setCompletingTaskId(task.id);

    try {
      // 1. Update the task status to completed
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, { status: 'completed' });

      // 2. Advanced: Reward Points by finding the Volunteer document and safely incrementing
      const volQuery = query(
        collection(db, 'volunteers'), 
        where('email', '==', currentUser.email)
      );
      
      const volSnapshot = await getDocs(volQuery);
      
      if (!volSnapshot.empty) {
        // Assume the first match is our volunteer profile
        const volunteerDoc = volSnapshot.docs[0];
        const volunteerRef = doc(db, 'volunteers', volunteerDoc.id);
        
        await updateDoc(volunteerRef, {
          points: increment(Number(task.points) || 10) // Atomically add points!
        });
      }
      
    } catch (error) {
      console.error("Error completing mission:", error);
      alert("Failed to sync completion logic.");
    } finally {
      // Small timeout just to let the CSS success animation play out
      setTimeout(() => setCompletingTaskId(null), 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center text-center">
        <p className="text-slate-500 font-medium">Please login to view your assigned field missions.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen p-6 pb-24">
      {/* Header */}
      <div className="mb-8 pt-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Active Missions</h1>
        <p className="text-sm font-bold text-slate-500 uppercase mt-1">Field Operations</p>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[50vh]">
          <CheckCircle size={48} className="text-slate-200 mb-4" />
          <p className="text-lg font-bold text-slate-600">No active deployments</p>
          <p className="text-sm text-slate-400 mt-2">Stand by for your next assignment from central command.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {tasks.map(task => {
            const isCompleted = task.status === 'completed';
            const isCompleting = completingTaskId === task.id;

            return (
              <div 
                key={task.id} 
                className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-all duration-500 overflow-hidden relative ${
                  isCompleted ? 'opacity-50 grayscale scale-95' : 'hover:shadow-md'
                }`}
              >
                {/* Success Animation Overlay */}
                {isCompleting && (
                  <div className="absolute inset-0 bg-emerald-500 z-10 flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
                    <CheckCircle size={48} className="mb-2 animate-bounce" />
                    <span className="font-black tracking-widest uppercase">Mission Accomplished!</span>
                  </div>
                )}

                <div className="flex justify-between items-start mb-4">
                  <h3 className={`text-xl font-black ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    {task.title}
                  </h3>
                  
                  {isCompleted ? (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-black px-2 py-1 rounded-full">
                      Done
                    </span>
                  ) : (
                    <span className="bg-brand-navy text-white text-[10px] uppercase font-black px-2 py-1 rounded-full flex items-center gap-1">
                      <Award size={10} /> {task.points} PTS
                    </span>
                  )}
                </div>

                <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                  {task.description}
                </p>

                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase bg-slate-50 px-3 py-2 rounded-xl mb-6 w-max border border-slate-100">
                  <MapPin size={14} className="text-indigo-500" /> 
                  {task.location}
                </div>

                {!isCompleted && (
                  <button 
                    onClick={() => handleCompleteMission(task)}
                    disabled={isCompleting}
                    className="w-full bg-indigo-600 text-white font-black py-4 rounded-3xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 flex justify-center items-center gap-2 active:scale-95"
                  >
                    <CheckCircle size={20} />
                    Complete Mission
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

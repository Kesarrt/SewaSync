import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { sendTaskAssignmentEmail } from '../emailService';
import { CheckSquare, PlusCircle, UserCheck, MapPin, Award, Trash2 } from 'lucide-react';

const locationData = {
  'Ramtek': ['T Point', 'Shitalwadi', 'Nagardhan', 'Station Road', 'Gandhi Chowk', 'KITS Area'],
  'Nagpur': ['Sonegaon', 'Sitabuldi', 'Dharampeth', 'Itwari']
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: '',
    mainArea: 'Ramtek',
    subArea: 'T Point',
    assignedTo: '' // Will hold the volunteer's ID or name
  });

  useEffect(() => {
    // 1. Fetch live tasks
    const tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Fetch approved volunteers for the assignment dropdown
    const volQuery = query(collection(db, 'volunteers'), where('status', '==', 'approved'));
    const unsubVolunteers = onSnapshot(volQuery, (snapshot) => {
      setVolunteers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubTasks();
      unsubVolunteers();
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMainAreaChange = (e) => {
    const newMainArea = e.target.value;
    setFormData({
       ...formData,
       mainArea: newMainArea,
       subArea: locationData[newMainArea][0]
    });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Find the selected volunteer to get their email
      const selectedVol = volunteers.find(v => v.name === formData.assignedTo);
      const assignedEmail = selectedVol ? selectedVol.email : null;

      await addDoc(collection(db, 'tasks'), {
        title: formData.title,
        description: formData.description,
        points: Number(formData.points) || 10, // default 10 points
        location: formData.subArea, // CRITICAL: Save subArea as geospatial reference
        assignedTo: formData.assignedTo || 'Unassigned',
        assignedToEmail: assignedEmail,
        assignedToName: selectedVol?.name || 'Unassigned',
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      // Trigger EmailJS notification if a volunteer was assigned
      if (selectedVol && assignedEmail) {
        try {
          await sendTaskAssignmentEmail(
            assignedEmail,
            selectedVol.name,
            formData.title,
            formData.subArea
          );
        } catch (emailError) {
          console.error("Failed to send task assignment email:", emailError);
        }
      }

      // Reset form strictly keeping area defaults
      setFormData({ ...formData, title: '', description: '', points: '', assignedTo: '' });
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const markCompleted = async (taskId) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: 'completed' });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const deleteTask = async (taskId) => {
    if(window.confirm("Permanently delete this task?")) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto bg-theme-base transition-colors duration-300 min-h-screen rounded-[2.5rem]">
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-theme-text flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
          <CheckSquare className="text-theme-primary" size={32} />
          Task Center
        </h1>
        <p className="text-theme-text opacity-70 font-bold text-xs uppercase mt-2">Manage Community Ops</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* TASK CREATOR FORM (Left Column / Top on Mobile) */}
        <div className="lg:col-span-5 bg-theme-surface transition-colors duration-300 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-theme-primary/10 flex flex-col h-max animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-theme-text">Assign New Mission</h2>
            <div className="bg-theme-primary/10 text-theme-primary p-2 rounded-xl">
              <PlusCircle size={20} />
            </div>
          </div>

          <form onSubmit={handleCreateTask} className="flex flex-col gap-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest shrink-0">Mission Title</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Flood Kit Delivery"
                className="w-full mt-1 bg-theme-base border border-slate-200/20 text-theme-text px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-theme-primary font-bold shadow-inner transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Main Area</label>
                <select 
                   value={formData.mainArea} 
                   onChange={handleMainAreaChange} 
                   className="w-full mt-1 bg-theme-base border border-slate-200/20 text-theme-text px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-theme-primary font-bold shadow-inner transition-all cursor-pointer"
                >
                   {Object.keys(locationData).map(area => <option key={area} value={area}>{area}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Sub-Area</label>
                <select 
                   name="subArea"
                   value={formData.subArea} 
                   onChange={handleChange} 
                   className="w-full mt-1 bg-theme-base border border-slate-200/20 text-theme-text px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-theme-primary font-bold shadow-inner transition-all cursor-pointer"
                >
                   {locationData[formData.mainArea].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {/* Points */}
               <div>
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Reward Pts</label>
                <div className="relative mt-1">
                  <input 
                    type="number" 
                    name="points"
                    value={formData.points}
                    onChange={handleChange}
                    required
                    placeholder="100"
                    className="w-full bg-theme-base border border-slate-200/20 text-theme-text pl-10 pr-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-theme-primary font-black shadow-inner transition-all"
                  />
                  <Award className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                </div>
              </div>

               {/* Volunteer Assignment */}
               <div>
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Assign Operative</label>
                <select 
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="w-full mt-1 bg-theme-base border border-slate-200/20 text-theme-text px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-theme-primary font-bold shadow-inner transition-all cursor-pointer"
                >
                  <option value="">Open / Unassigned</option>
                  {volunteers.map(vol => (
                    <option key={vol.id} value={vol.name}>{vol.name} - {vol.expertise || 'General'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Briefing</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="3"
                placeholder="What exactly needs to be done?"
                className="w-full mt-1 bg-theme-base border border-slate-200/20 text-theme-text px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-theme-primary font-medium shadow-inner transition-all resize-none"
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="mt-4 w-full bg-theme-primary text-white font-black py-4 rounded-2xl hover:brightness-110 shadow-lg shadow-theme-primary/30 flex justify-center items-center gap-2 disabled:bg-slate-400 disabled:shadow-none transition-all uppercase tracking-widest text-xs"
            >
              {isSubmitting ? 'Deploying Protocol...' : 'Deploy Mission'}
            </button>
          </form>
        </div>

        {/* LIVE TASK FEED (Right Column) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {tasks.length === 0 ? (
             <div className="bg-theme-surface transition-colors duration-300 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-slate-400 h-64 text-center">
               <CheckSquare size={48} className="mb-4 text-theme-primary/30" />
               <p className="font-bold text-lg text-theme-text">No active operations</p>
               <p className="text-sm opacity-60 text-theme-text">Use the command form to assign your first mission.</p>
             </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id} 
                className={`bg-theme-surface transition-colors duration-300 p-6 rounded-3xl border border-slate-100/10 shadow-sm relative group transition-all animate-in fade-in slide-in-from-right-8`}
              >
                <div className="flex justify-between items-start mb-3 border-b border-theme-base pb-4">
                  <div>
                    <h3 className={`text-lg font-black ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-theme-text'} leading-tight`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase bg-theme-base px-2.5 py-1 rounded-lg tracking-widest shadow-inner">
                        <MapPin size={10} className="text-theme-primary" /> {task.location}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase bg-theme-base px-2.5 py-1 rounded-lg tracking-widest shadow-inner">
                        <Award size={12} /> {task.points} PTS
                      </span>
                    </div>
                  </div>
                  
                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {task.status}
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Sequence"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-sm opacity-80 text-theme-text mb-6 leading-relaxed">
                  {task.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  {/* Assignment Ribbon */}
                  <div className="flex items-center gap-2 bg-theme-base border border-slate-200/10 text-theme-text px-4 py-2 rounded-2xl shadow-inner">
                    <UserCheck size={16} className="text-theme-primary" />
                    <span className="text-[10px] font-black tracking-widest uppercase opacity-60">Operative:</span>
                    <span className="text-sm font-black truncate max-w-[120px] sm:max-w-max text-theme-primary">
                      {task.assignedTo}
                    </span>
                  </div>

                  {/* Complete Button */}
                  {task.status !== 'completed' && (
                    <button 
                      onClick={() => markCompleted(task.id)}
                      className="bg-emerald-500 hover:brightness-110 text-white font-black px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20"
                    >
                      <CheckSquare size={14} /> Finish Action
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

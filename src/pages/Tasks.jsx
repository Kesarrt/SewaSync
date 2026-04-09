import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckSquare, PlusCircle, UserCheck, MapPin, Award, Trash2 } from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: '',
    location: '',
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

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'tasks'), {
        title: formData.title,
        description: formData.description,
        points: Number(formData.points) || 10, // default 10 points
        location: formData.location,
        assignedTo: formData.assignedTo || 'Unassigned',
        status: 'pending', // pending, active, completed
        createdAt: serverTimestamp()
      });
      
      // Reset form
      setFormData({ title: '', description: '', points: '', location: '', assignedTo: '' });
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen rounded-3xl">
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
          <CheckSquare className="text-indigo-600" size={32} />
          Task Center
        </h1>
        <p className="text-slate-500 font-bold text-xs uppercase mt-2">Manage Community Ops</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* TASK CREATOR FORM (Left Column / Top on Mobile) */}
        <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-max">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-800">Assign New Mission</h2>
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
              <PlusCircle size={20} />
            </div>
          </div>

          <form onSubmit={handleCreateTask} className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-bold text-slate-600 ml-2 uppercase tracking-wide">Mission Title</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Flood Kit Delivery"
                className="w-full mt-1 bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 ml-2 uppercase tracking-wide">Location Details</label>
              <div className="relative mt-1">
                <input 
                  type="text" 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="Sector 8 Supply Depot"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-10 pr-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all font-medium"
                />
                <MapPin className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {/* Points */}
               <div>
                <label className="text-xs font-bold text-slate-600 ml-2 uppercase tracking-wide">Reward Pts</label>
                <div className="relative mt-1">
                  <input 
                    type="number" 
                    name="points"
                    value={formData.points}
                    onChange={handleChange}
                    required
                    placeholder="100"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-10 pr-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all font-medium font-mono"
                  />
                  <Award className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                </div>
              </div>

               {/* Volunteer Assignment dropdown connecting to Firestore */}
               <div>
                <label className="text-xs font-bold text-slate-600 ml-2 uppercase tracking-wide">Assign To</label>
                <select 
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all font-medium appearance-none"
                >
                  <option value="">Open / Unassigned</option>
                  {volunteers.map(vol => (
                    <option key={vol.id} value={vol.name}>{vol.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 ml-2 uppercase tracking-wide">Briefing Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="3"
                placeholder="What exactly needs to be done?"
                className="w-full mt-1 bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all font-medium"
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="mt-4 w-full bg-indigo-600 text-white font-bold py-4 rounded-3xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 flex justify-center items-center gap-2 disabled:bg-slate-400 disabled:shadow-none"
            >
              {isSubmitting ? 'Deploying...' : 'Dispatch Mission'}
            </button>
          </form>
        </div>

        {/* LIVE TASK FEED (Right Column) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {tasks.length === 0 ? (
             <div className="bg-white rounded-3xl border border-slate-100 p-10 flex flex-col items-center justify-center text-slate-400 h-64 text-center">
               <CheckSquare size={48} className="mb-4 text-slate-200" />
               <p className="font-bold text-lg text-slate-500">No active tasks</p>
               <p className="text-sm">Use the form to assign your first mission.</p>
             </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id} 
                className={`bg-white p-6 rounded-3xl border ${task.status === 'completed' ? 'border-emerald-100 opacity-60' : 'border-slate-100'} shadow-sm relative group transition-all`}
              >
                <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-4">
                  <div>
                    <h3 className={`text-lg font-bold ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                        <MapPin size={10} /> {task.location}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">
                        <Award size={10} /> {task.points} PTS
                      </span>
                    </div>
                  </div>
                  
                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
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

                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  {task.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  {/* Assigment Ribbon */}
                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-2xl">
                    <UserCheck size={16} className="text-indigo-500" />
                    <span className="text-xs font-bold shrink-0">Operator:</span>
                    <span className="text-sm font-black truncate max-w-[120px] sm:max-w-max">
                      {task.assignedTo}
                    </span>
                  </div>

                  {/* Complete Button */}
                  {task.status !== 'completed' && (
                    <button 
                      onClick={() => markCompleted(task.id)}
                      className="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-500 hover:text-white font-bold px-4 py-2 rounded-2xl text-xs uppercase tracking-wide transition-colors flex items-center gap-2"
                    >
                      <CheckSquare size={14} /> Finish
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

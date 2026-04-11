import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Target, Users, Award, Activity, PieChart as PieIcon, MapPin, TrendingUp } from 'lucide-react';

export default function Analytics() {
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);

  useEffect(() => {
    // Fetch live tasks
    const tasksQuery = query(collection(db, 'tasks'));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch live volunteers
    const volQuery = query(collection(db, 'volunteers'));
    const unsubVolunteers = onSnapshot(volQuery, (snapshot) => {
      setVolunteers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubTasks();
      unsubVolunteers();
    };
  }, []);

  // 1. STATS CALCULATIONS
  const totalTasks = tasks.length;
  const approvedVols = volunteers.filter(v => v.status === 'approved');
  const totalVolunteers = approvedVols.length;
  const totalCredits = approvedVols.reduce((sum, v) => sum + (Number(v.credits) || 0), 0);
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasksCount / totalTasks) * 100);

  // 2. DATA FORMATTING: PIE CHART (Task Categories)
  const categoryData = React.useMemo(() => {
    const counts = {};
    tasks.forEach(t => {
      // If a task doesn't have an explicit category, derive it from the first word of the title for display mapping
      const rawCat = t.category || (t.title ? t.title.split(' ')[0] : 'General');
      const cat = rawCat.length > 10 ? rawCat.substring(0, 10) + '...' : rawCat;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [tasks]);

  const PIE_COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

  // 3. DATA FORMATTING: BAR CHART (Task Locations)
  const locationData = React.useMemo(() => {
    const counts = {};
    tasks.forEach(t => {
      if(t.location) {
        counts[t.location] = (counts[t.location] || 0) + 1;
      }
    });
    return Object.keys(counts)
      .map(loc => ({ name: loc, Count: counts[loc] }))
      .sort((a, b) => b.Count - a.Count)
      .slice(0, 6); // Top 6 active areas
  }, [tasks]);

  // 4. DATA FORMATTING: LINE CHART (Activity Trend)
  const trendData = React.useMemo(() => {
    const dates = {};
    const validTasks = tasks.filter(t => t.createdAt?.seconds);
    validTasks.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);
    
    validTasks.forEach(t => {
      const dateObj = new Date(t.createdAt.seconds * 1000);
      const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      dates[dateStr] = (dates[dateStr] || 0) + 1;
    });
    return Object.keys(dates).map(date => ({ date, Missions: dates[date] }));
  }, [tasks]);

  // Reusable custom tooltip wrapper for matching themes
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-theme-surface bg-opacity-95 p-4 rounded-xl shadow-xl border border-slate-200/10 backdrop-blur-sm">
          <p className="font-bold text-theme-text text-sm mb-1">{label || payload[0].name}</p>
          <p className="text-theme-primary font-black text-lg">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto bg-theme-base transition-colors duration-300 min-h-screen text-left rounded-[2.5rem]">
      
      {/* Header */}
      <div className="mb-10 animate-in fade-in slide-in-from-left-4">
        <h1 className="text-3xl font-black text-theme-text flex items-center gap-2">
          <Activity className="text-theme-primary" size={32} />
          Telemetry Data
        </h1>
        <p className="text-theme-text opacity-70 font-bold text-xs uppercase mt-2">Mission Control Analytics Platform</p>
      </div>

      {tasks.length === 0 ? (
         <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-theme-surface w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-200/10 text-theme-primary/50">
               <Activity size={48} />
            </div>
            <h2 className="text-2xl font-black text-theme-text tracking-tight">No active missions in this sector yet.</h2>
            <p className="text-theme-text opacity-50 font-bold mt-2 uppercase tracking-widest text-[10px]">Deploy missions to generate analytics telemetry.</p>
         </div>
      ) : (
      <>
        {/* TOP ROW: Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Card 1: Total Missions */}
          <div className="bg-theme-surface rounded-[2rem] p-6 shadow-sm border border-slate-200/10 flex items-center justify-between group hover:-translate-y-1 transition-transform duration-300 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Operations</p>
              <h3 className="text-4xl font-black text-theme-text">{totalTasks}</h3>
            </div>
            <div className="bg-indigo-500/10 text-indigo-500 p-4 rounded-2xl group-hover:scale-110 transition-transform"><Target size={28}/></div>
          </div>

          {/* Card 2: Field Operatives */}
          <div className="bg-theme-surface rounded-[2rem] p-6 shadow-sm border border-slate-200/10 flex items-center justify-between group hover:-translate-y-1 transition-transform duration-300 animate-in fade-in slide-in-from-bottom-4 delay-75">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Operatives</p>
              <h3 className="text-4xl font-black text-theme-text">{totalVolunteers}</h3>
            </div>
            <div className="bg-teal-500/10 text-teal-500 p-4 rounded-2xl group-hover:scale-110 transition-transform"><Users size={28}/></div>
          </div>

          {/* Card 3: Total Credits Executed */}
          <div className="bg-theme-surface rounded-[2rem] p-6 shadow-sm border border-slate-200/10 flex items-center justify-between group hover:-translate-y-1 transition-transform duration-300 animate-in fade-in slide-in-from-bottom-4 delay-150">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Credit Economy</p>
              <h3 className="text-4xl font-black text-theme-text">{totalCredits}</h3>
            </div>
            <div className="bg-amber-500/10 text-amber-500 p-4 rounded-2xl group-hover:scale-110 transition-transform"><Award size={28}/></div>
          </div>

          {/* Card 4: Operation Fidelity */}
          <div className="bg-theme-surface rounded-[2rem] p-6 shadow-sm border border-slate-200/10 flex items-center justify-between group hover:-translate-y-1 transition-transform duration-300 animate-in fade-in slide-in-from-bottom-4 delay-200">
             <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Completion Rate</p>
              <div className="flex items-end gap-2">
                 <h3 className="text-4xl font-black text-emerald-500">{completionRate}%</h3>
              </div>
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-2xl group-hover:scale-110 transition-transform"><Activity size={28}/></div>
          </div>
        </div>

        {/* MIDDLE ROW: Graphs (Pie & Bar) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Categories Pie Chart */}
          <div className="bg-theme-surface rounded-[2.5rem] p-8 shadow-sm border border-slate-200/10 animate-in fade-in duration-700">
             <h2 className="text-lg font-black text-theme-text flex items-center gap-2 mb-6">
                <PieIcon className="text-indigo-500" size={20} /> Mission Categorization
             </h2>
             
             <div className="h-64 w-full">
                {categoryData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                         >
                            {categoryData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                         </Pie>
                         <RechartsTooltip content={<CustomTooltip />} />
                      </PieChart>
                   </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-slate-400 font-bold opacity-50">Awaiting telemetry signatures...</div>
                )}
             </div>

             {/* Manual Legend */}
             <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                {categoryData.map((entry, index) => (
                   <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                      <span className="text-xs font-bold text-theme-text opacity-70 uppercase">{entry.name} ({entry.value})</span>
                   </div>
                ))}
             </div>
          </div>

          {/* Location Bar Chart */}
          <div className="bg-theme-surface rounded-[2.5rem] p-8 shadow-sm border border-slate-200/10 animate-in fade-in duration-700 delay-150">
             <h2 className="text-lg font-black text-theme-text flex items-center gap-2 mb-6">
                <MapPin className="text-teal-500" size={20} /> Ops Geolocation
             </h2>
             
             <div className="h-72 w-full">
                {locationData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={locationData} maxBarSize={40}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                         <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                            dy={10}
                         />
                         <YAxis hide />
                         <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                         <Bar dataKey="Count" fill="var(--theme-primary, #6366f1)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                   </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-slate-400 font-bold opacity-50">Awaiting geolocation mapping...</div>
                )}
             </div>
          </div>

        </div>

        {/* BOTTOM ROW: Activity Trend Line Chart */}
        <div className="bg-theme-surface rounded-[2.5rem] p-8 shadow-sm border border-slate-200/10 animate-in fade-in duration-700 delay-300">
           <h2 className="text-lg font-black text-theme-text flex items-center gap-2 mb-8">
              <TrendingUp className="text-rose-500" size={20} /> Timeline Execution Trend
           </h2>

           <div className="h-80 w-full">
              {trendData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                       <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                          dy={15}
                       />
                       <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                          dx={-10}
                       />
                       <RechartsTooltip content={<CustomTooltip />} />
                       <Line 
                          type="monotone" 
                          dataKey="Missions" 
                          stroke="var(--theme-primary, #6366f1)" 
                          strokeWidth={4}
                          dot={{ fill: 'var(--theme-primary, #6366f1)', r: 5, strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 8 }}
                       />
                    </LineChart>
                 </ResponsiveContainer>
              ) : (
                 <div className="h-full flex items-center justify-center text-slate-400 font-bold opacity-50">Insufficient data for timeline modeling...</div>
              )}
           </div>
        </div>
      </>
      )}

    </div>
  );
}

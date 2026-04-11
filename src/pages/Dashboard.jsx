import React, { useEffect, useState } from 'react'
import { LogOut, Users, MessageSquare, Sparkles, Clock, CheckCircle, Trash2, XCircle, Heart, Target } from 'lucide-react'
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
// ✅ Linked to your new Email Engine
import { sendWelcomeEmail, sendTaskAssignmentEmail } from '../emailService'
import ActiveTeam from '../components/ActiveTeam'

export default function Dashboard() {
  const navigate = useNavigate();

  const [adminName, setAdminName] = useState('');
  const [volunteers, setVolunteers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [aiResponse, setAiResponse] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);

  // CMS State
  const [workTitle, setWorkTitle] = useState('');
  const [workDesc, setWorkDesc] = useState('');
  const [workFile, setWorkFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [recentWork, setRecentWork] = useState([]);
  const [emergencies, setEmergencies] = useState([]);

  // 📦 0. Auth State Checker
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.displayName) {
          setAdminName(user.displayName);
        } else if (user.email) {
          setAdminName(user.email.split('@')[0]);
        } else {
          setAdminName('Admin');
        }
      } else {
        setAdminName('');
      }
    });
    return () => unsubAuth();
  }, []);

  // 📦 1. Real-time Firebase Data Sync
  useEffect(() => {
    const volQuery = query(collection(db, 'volunteers'), orderBy('createdAt', 'desc'));
    const unsubVol = onSnapshot(volQuery, (snapshot) => {
      setVolunteers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const msgQuery = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubMsg = onSnapshot(msgQuery, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const workQuery = query(collection(db, 'recentWork'), orderBy('createdAt', 'desc'));
    const unsubWork = onSnapshot(workQuery, (snapshot) => {
      setRecentWork(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const emergencyQuery = query(collection(db, 'emergencies'), orderBy('timestamp', 'desc'));
    const unsubEmergencies = onSnapshot(emergencyQuery, (snapshot) => {
      setEmergencies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(e => e.status === 'critical'));
    });

    return () => {
      unsubVol();
      unsubMsg();
      unsubWork();
      unsubEmergencies();
    };
  }, []);

  // 🔐 Logout Logic
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/public');
  };

  // ✅ 2. Approve Volunteer & Trigger Welcome Email
 // Inside handleApproveVolunteer
const handleApproveVolunteer = async (vol) => {
  try {
    // 1. Update Firestore
    await updateDoc(doc(db, 'volunteers', vol.id), {
      status: 'approved',
      role: 'volunteer',
      joinedAt: serverTimestamp()
    });



    // 2. Extra safety: Log the data to be sure it's there
    console.log("Attempting to send email to:", vol.email);

    if (vol.email && vol.name) {
      await sendWelcomeEmail(vol.email, vol.name);
      alert(`Success! Email sent to ${vol.email}`);
    } else {
      console.error("Missing email or name in the volunteer object", vol);
      alert("Database updated, but volunteer data was missing for the email!");
    }
  } catch (err) {
    console.error("Critical error in approval:", err);
  }
};



  // ❌ Delete (Reject) Record
  const handleRemoveItem = async (collectionName, id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteDoc(doc(db, collectionName, id));
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  // Image Encoding Helper
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAddRecentWork = async (e) => {
    e.preventDefault();
    if (!workTitle || !workDesc || !workFile) return;

    try {
      setIsUploading(true);
      
      // Encode file natively as Base64 string to bypass Firebase Storage costs
      const base64Image = await convertToBase64(workFile);

      // Save document to Firestore
      await addDoc(collection(db, 'recentWork'), {
        title: workTitle,
        description: workDesc,
        imageUrl: base64Image,
        createdAt: serverTimestamp()
      });
      
      setWorkTitle('');
      setWorkDesc('');
      setWorkFile(null);
      // reset file input
      document.getElementById("workImageInput").value = "";
    } catch (err) {
      console.error("Error adding recent work:", err);
      alert("Failed to publish story. Check console.");
    } finally {
      setIsUploading(false);
    }
  };

  const generateStrategy = async () => {
    if (!messages.length) {
      setAiResponse({
        urgent: [],
        help_seekers: [],
        volunteers: [],
        actions: ["No data to analyze"]
      });
      return;
    }

    const now = Date.now();
    if (now - lastRequestTime < 5000) return;
    setLastRequestTime(now);

    try {
      setIsGenerating(true);
      const apiKey = import.meta.env.VITE_GEMINI_KEY;
      const messagesPrompt = messages.length > 0 ? messages.map(m => `${m.name}: ${m.message}`).join("\n") : "None";

      // Note: Using gemini-1.5-flash-latest for 2026 stability
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Analyze these community messages for an NGO. 
Return ONLY a raw JSON object.

CRITICAL RULES:
1. "volunteers": Include anyone saying they want to join, help, work with us, or offering skills.
2. "urgent": Include immediate needs like "urgently", "emergency", "flood", "starving".
3. "help_seekers": Include general requests for food, clothes, or info.
4. "actions": Suggest 2-3 specific steps the Admin should take.

Format:
{
  "urgent": [],
  "help_seekers": [],
  "volunteers": [],
  "actions": []
}

Messages to analyze:
${messagesPrompt}`
              }]
            }]
          })
        }
      );

      if (!response.ok) throw new Error("API_LIMIT");

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      
      // Robust Cleaning: Remove any markdown backticks, then extract the substring from first '{' to last '}'
      let cleanText = rawText.replace(/```json|```/gi, "").trim();
      const startIdx = cleanText.indexOf('{');
      const endIdx = cleanText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        cleanText = cleanText.substring(startIdx, endIdx + 1);
      } else {
        throw new Error("No JSON object found in response");
      }

      setAiResponse(JSON.parse(cleanText));

    } catch (error) {
      console.log("⚠️ Fallback Active", error);
      setAiResponse({
        urgent: messages.filter(m => m.message.toLowerCase().includes("help")).map(m => `${m.name}: urgent help`),
        help_seekers: [],
        volunteers: [],
        actions: ["Error parsing AI response. Review incoming messages manually."]
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-theme-base transition-colors duration-300 min-h-screen text-left relative">

      {/* 🚨 SOS EMERGENCY BANNER */}
      {emergencies.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-5xl animate-in slide-in-from-top-10 fade-in duration-300">
          <div className="bg-red-600 shadow-2xl shadow-red-600/40 rounded-3xl p-1 flex flex-col md:flex-row shadow-inner">
             {emergencies.map(sos => (
                <div key={sos.id} className="flex-1 bg-red-700/50 m-1 rounded-2xl p-4 flex items-center justify-between border border-red-500/50 backdrop-blur-md">
                   <div className="flex items-center gap-4">
                     <div className="bg-red-100 text-red-600 p-3 rounded-full animate-pulse shadow-md">
                       <Target size={24} />
                     </div>
                     <div>
                       <h3 className="font-black text-white text-lg tracking-wide uppercase">SOS Received</h3>
                       <p className="text-red-100 text-xs font-bold font-mono mt-1">
                          OPERATIVE: {sos.volunteerName} ({sos.phone})<br/>
                          COORDS: {sos.location}
                       </p>
                     </div>
                   </div>
                   <button 
                      onClick={() => updateDoc(doc(db, 'emergencies', sos.id), { status: 'resolved' })}
                      className="bg-white text-red-600 hover:bg-red-50 font-black px-6 py-3 rounded-xl uppercase tracking-widest text-xs shadow-md transition-all active:scale-95"
                   >
                     Acknowledge
                   </button>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-theme-surface transition-colors duration-300 p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-theme-text tracking-tight text-left">
            Welcome back, <span className="text-indigo-600">{adminName || 'Admin'}</span>
          </h1>
          <p className="text-sm text-slate-500 font-bold uppercase flex items-center gap-1 mt-1">
            <Clock size={14}/> Operational Dashboard
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={generateStrategy}
            disabled={isGenerating}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100"
          >
            <Sparkles size={18}/>
            {isGenerating ? "Analyzing..." : "AI Insight"}
          </button>

          <button onClick={handleLogout} className="bg-theme-surface p-2.5 rounded-2xl text-slate-500 hover:text-red-500 transition-all">
            <LogOut size={20}/>
          </button>
        </div>
      </div>

      {/* 🤖 AI STRATEGY CARDS */}
      {aiResponse && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-red-50 p-5 border-l-4 border-red-500 rounded-2xl">
            <h3 className="font-black text-[10px] text-red-600 uppercase tracking-widest mb-2">🚨 Urgent</h3>
            {aiResponse.urgent?.map((i, idx) => <p key={idx} className="text-xs text-red-900 font-medium mb-1">• {i}</p>)}
          </div>
          <div className="bg-amber-50 p-5 border-l-4 border-amber-500 rounded-2xl">
            <h3 className="font-black text-[10px] text-amber-600 uppercase tracking-widest mb-2">🆘 Help</h3>
            {aiResponse.help_seekers?.map((i, idx) => <p key={idx} className="text-xs text-amber-900 font-medium mb-1">• {i}</p>)}
          </div>
          <div className="bg-emerald-50 p-5 border-l-4 border-emerald-500 rounded-2xl">
            <h3 className="font-black text-[10px] text-emerald-600 uppercase tracking-widest mb-2">🤝 Volunteers</h3>
            {aiResponse.volunteers?.map((i, idx) => <p key={idx} className="text-xs text-emerald-900 font-medium mb-1">• {i}</p>)}
          </div>
          <div className="bg-indigo-50 p-5 border-l-4 border-indigo-500 rounded-2xl">
            <h3 className="font-black text-[10px] text-indigo-600 uppercase tracking-widest mb-2">⚡ Actions</h3>
            {aiResponse.actions?.map((i, idx) => <p key={idx} className="text-xs text-indigo-900 font-medium mb-1">• {i}</p>)}
          </div>
        </div>
      )}

      {/* DATA MANAGEMENT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Active Team Leaderboard Column */}
        <div className="lg:col-span-1">
          <ActiveTeam />
        </div>

        {/* Volunteers Column */}
        <div className="bg-theme-surface transition-colors duration-300 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 lg:col-span-1">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-theme-text"><Users size={22} className="text-indigo-500"/> Volunteer Applications</h2>

          {volunteers.length === 0 ? (
            <p className="text-slate-400 text-sm italic">No applications in the queue.</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {volunteers.map(vol => (
                <div key={vol.id} className="flex justify-between items-center p-5 bg-theme-base transition-colors duration-300/50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                  <div className="text-left">
                    <p className="font-bold text-theme-text">{vol.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{vol.location || 'Location Pending'}</p>
                    <div className="mt-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${vol.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {vol.status || 'pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {vol.status !== 'approved' && (
                      <button 
                        onClick={() => handleApproveVolunteer(vol)}
                        className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md"
                        title="Approve Volunteer"
                      >
                        <CheckCircle size={20}/>
                      </button>
                    )}
                    <button 
                      onClick={() => handleRemoveItem('volunteers', vol.id)}
                      className="p-2.5 bg-theme-surface transition-colors duration-300 text-slate-300 hover:text-red-500 border border-slate-100 hover:border-red-100 rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 size={20}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Community Messages Column */}
        <div className="bg-theme-surface transition-colors duration-300 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 lg:col-span-1">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-theme-text"><MessageSquare size={22} className="text-teal-500"/> Community Voice</h2>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {messages.map(msg => (
              <div key={msg.id} className="p-5 bg-theme-base transition-colors duration-300/50 rounded-2xl border border-slate-100 relative group hover:border-teal-200 transition-all">
                <button 
                  onClick={() => handleRemoveItem('messages', msg.id)} 
                  className="absolute right-4 top-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <XCircle size={18}/>
                </button>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">{msg.name}</p>
                <p className="text-sm text-slate-700 italic font-medium leading-relaxed">"{msg.message}"</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CONTENT MANAGEMENT SYSTEM */}
      <h2 className="text-2xl font-black text-theme-text mt-12 mb-6 flex items-center gap-2">
        <Heart size={26} className="text-rose-500" /> CMS: Recent Work Gallery
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        
        {/* ADD FORM */}
        <div className="bg-theme-surface transition-colors duration-300 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 lg:col-span-1">
          <h3 className="text-lg font-bold text-theme-text mb-6 tracking-tight">Publish Impact Story</h3>
          <form onSubmit={handleAddRecentWork} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1">Title</label>
              <input 
                required value={workTitle} onChange={e => setWorkTitle(e.target.value)} 
                className="w-full bg-theme-base transition-colors duration-300 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none text-sm font-medium transition-all" 
                placeholder="e.g. Flood Relief 2026" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1">Description</label>
              <textarea 
                required value={workDesc} onChange={e => setWorkDesc(e.target.value)} 
                className="w-full bg-theme-base transition-colors duration-300 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none text-sm font-medium transition-all resize-none" 
                rows="3" placeholder="Impact description..." 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1">Local Image File</label>
              <input 
                id="workImageInput"
                type="file" 
                accept="image/*"
                required 
                onChange={e => setWorkFile(e.target.files[0])} 
                className="w-full bg-theme-base text-theme-text transition-colors duration-300 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 outline-none text-sm font-medium transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 placeholder:text-slate-400 cursor-pointer" 
              />
            </div>
            <button 
              type="submit" 
              disabled={isUploading}
              className="mt-2 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Publishing...' : 'Publish Story'}
            </button>
          </form>
        </div>

        {/* GALLERY MANAGER */}
        <div className="bg-theme-surface transition-colors duration-300 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-theme-text mb-6 tracking-tight">Published Gallery ({recentWork.length})</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {recentWork.length === 0 ? (
              <p className="text-slate-400 text-sm italic col-span-2 bg-theme-base transition-colors duration-300 p-6 rounded-2xl text-center">No recent work published. Start posting to your public portal!</p>
            ) : (
              recentWork.map(work => (
                <div key={work.id} className="border border-slate-100 rounded-2xl flex overflow-hidden group shadow-sm hover:shadow-md transition-shadow bg-theme-surface transition-colors duration-300 h-28">
                  <div className="w-28 bg-theme-surface overflow-hidden shrink-0">
                    <img src={work.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1593113511332-9cbca45b4b1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'} />
                  </div>
                  <div className="p-4 flex flex-col justify-center flex-1 relative">
                    <button 
                      onClick={() => handleRemoveItem('recentWork', work.id)} 
                      className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Story"
                    >
                      <Trash2 size={16} />
                    </button>
                    <h4 className="font-bold text-theme-text text-sm mb-1 pr-6 leading-tight line-clamp-1">{work.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{work.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
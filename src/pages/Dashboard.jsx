import React, { useEffect, useState } from 'react'
import { LogOut, Users, MessageSquare, Sparkles, Clock, CheckCircle, Trash2, XCircle } from 'lucide-react'
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
// ✅ Linked to your new Email Engine
import { sendWelcomeEmail, sendTaskAssignmentEmail } from '../emailService'

export default function Dashboard() {
  const navigate = useNavigate();

  const [volunteers, setVolunteers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [aiResponse, setAiResponse] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);

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

    return () => {
      unsubVol();
      unsubMsg();
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


// ✅ 3. Assign Task & Trigger Task Email
const handleAssignTask = async (vol) => {
  const taskName = window.prompt(`Assign a mission to ${vol.name}:`);
  const location = window.prompt(`Enter location for ${vol.name}:`);

  if (taskName && location) {
    try {
      await sendTaskAssignmentEmail(vol.email, vol.name, taskName, location);
      alert(`Mission assigned! Email sent to ${vol.name}`);
    } catch (err) {
      console.error("Task assignment failed:", err);
      alert("Failed to send task email. Check console.");
    }
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

  // 🤖 3. AI Strategy Function (Antigravity Engine)
  const generateStrategy = async () => {
    if (!messages.length) return alert("No messages found!");

    const now = Date.now();
    if (now - lastRequestTime < 5000) return;
    setLastRequestTime(now);

    try {
      setIsGenerating(true);
      const apiKey = import.meta.env.VITE_GEMINI_KEY;
      const messagesPrompt = messages.map(m => `${m.name}: ${m.message}`).join("\n");

      // Note: Using gemini-1.5-flash-latest for 2026 stability
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Return ONLY JSON:
{
"urgent": [],
"help_seekers": [],
"volunteers": [],
"actions": []
}

Messages:
${messagesPrompt}`
              }]
            }]
          })
        }
      );

      if (!response.ok) throw new Error("API_LIMIT");

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const cleanText = rawText.replace(/```json|```/g, "").trim();
      setAiResponse(JSON.parse(cleanText));

    } catch (error) {
      console.log("⚠️ Fallback Active");
      setAiResponse({
        urgent: messages.filter(m => m.message.toLowerCase().includes("help")).map(m => `${m.name}: urgent help`),
        actions: ["Review incoming messages", "Verify pending volunteers"]
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen text-left">

      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight text-left">SewaSync <span className="text-indigo-600">Admin</span></h1>
          <p className="text-sm text-slate-500 font-bold uppercase flex items-center gap-1">
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

          <button onClick={handleLogout} className="bg-slate-100 p-2.5 rounded-2xl text-slate-500 hover:text-red-500 transition-all">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Volunteers Column */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-800"><Users size={22} className="text-indigo-500"/> Volunteer Applications</h2>

          {volunteers.length === 0 ? (
            <p className="text-slate-400 text-sm italic">No applications in the queue.</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {volunteers.map(vol => (
                <div key={vol.id} className="flex justify-between items-center p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                  <div className="text-left">
                    <p className="font-bold text-slate-900">{vol.name}</p>
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
                      className="p-2.5 bg-white text-slate-300 hover:text-red-500 border border-slate-100 hover:border-red-100 rounded-xl transition-all"
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
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-800"><MessageSquare size={22} className="text-teal-500"/> Community Voice</h2>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {messages.map(msg => (
              <div key={msg.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 relative group hover:border-teal-200 transition-all">
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
    </div>
  );
}
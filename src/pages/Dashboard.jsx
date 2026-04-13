import React, { useEffect, useState } from 'react'
import { LogOut, Users, MessageSquare, Sparkles, Clock, CheckCircle, Trash2, XCircle, Heart, Target } from 'lucide-react'
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { sendWelcomeEmail } from '../emailService'
import ActiveTeam from '../components/ActiveTeam'

export default function Dashboard() {
  const navigate = useNavigate();

  const [adminName, setAdminName] = useState('');
  const [volunteers, setVolunteers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [aiResponse, setAiResponse] = useState({ urgent: [], help_seekers: [], volunteers: [], actions: [] });
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);

  // CMS State
  const [workTitle, setWorkTitle] = useState('');
  const [workDesc, setWorkDesc] = useState('');
  const [workFile, setWorkFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [recentWork, setRecentWork] = useState([]);
  const [emergencies, setEmergencies] = useState([]);

  // Auth Logic
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAdminName(user.displayName || user.email?.split('@')[0] || 'Admin');
      } else {
        setAdminName('');
      }
    });
    return () => unsubAuth();
  }, []);

  // Firebase Sync
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
      unsubVol(); unsubMsg(); unsubWork(); unsubEmergencies();
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/public');
  };

  const handleApproveVolunteer = async (vol) => {
    try {
      await updateDoc(doc(db, 'volunteers', vol.id), {
        status: 'approved',
        role: 'volunteer',
        joinedAt: serverTimestamp()
      });
      if (vol.email && vol.name) await sendWelcomeEmail(vol.email, vol.name);
    } catch (err) { console.error(err); }
  };

  const handleRemoveItem = async (col, id) => {
    if (window.confirm("Delete record?")) {
      try { await deleteDoc(doc(db, col, id)); } catch (err) { console.error(err); }
    }
  };

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
      const base64Image = await convertToBase64(workFile);
      await addDoc(collection(db, 'recentWork'), {
        title: workTitle, description: workDesc, imageUrl: base64Image, createdAt: serverTimestamp()
      });
      setWorkTitle(''); setWorkDesc(''); setWorkFile(null);
      document.getElementById("workImageInput").value = "";
    } catch (err) { console.error(err); } finally { setIsUploading(false); }
  };

  // 🤖 THE FIXED AI LOGIC
  const generateStrategy = async () => {
    if (!messages.length) return;

    const now = Date.now();
    if (now - lastRequestTime < 5000) return;
    setLastRequestTime(now);

    const makeRequest = async (isRetry = false) => {
      try {
        setIsGenerating(true);
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

        const messagesPrompt = messages.map(m => `${m.name}: ${m.message}`).join("\n");

        // ✅ URL FIXED: Added 'v1' and ensured the model path is exact
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Classify these messages into a raw JSON object: {"urgent":[], "help_seekers":[], "volunteers":[], "actions":[]}. Use the original text. \n\nMessages:\n${messagesPrompt}`
                }]
              }]
            })
          }
        );

        if (!response.ok) {
          const errorDetail = await response.json();
          console.error("Google API detailed error:", errorDetail);
          throw new Error("API_FAIL");
        }

        const data = await response.json();
        let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        // Clean markdown backticks if Gemini adds them
        const cleanedJson = rawText.replace(/```json|```/g, "").trim();
        const parsedData = JSON.parse(cleanedJson);

        setAiResponse({
          urgent: parsedData.urgent || [],
          help_seekers: parsedData.help_seekers || [],
          volunteers: parsedData.volunteers || [],
          actions: ["✅ AI Analysis Complete", ...(parsedData.actions || [])]
        });

      } catch (error) {
        console.error("AI Insight Error:", error);

        // 🆘 Automatic Fallback: This sorts the UI locally if the API is still being stubborn
        const urgent = [];
        const volunteersList = [];
        const help_seekers = [];

        messages.forEach(m => {
          const t = m.message.toLowerCase();
          if (t.includes('blood') || t.includes('urgent') || t.includes('emergency')) urgent.push(`${m.name}: ${m.message}`);
          else if (t.includes('volunteer') || t.includes('join')) volunteersList.push(`${m.name}: ${m.message}`);
          else help_seekers.push(`${m.name}: ${m.message}`);
        });

        setAiResponse({
          urgent, volunteers: volunteersList, help_seekers,
          actions: ["⚠️ Local Sorting Active", "AI Connection Pending"]
        });
      } finally {
        setIsGenerating(false);
      }
    };

    makeRequest(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-theme-base min-h-screen text-left relative">
      {/* Emergency Banner */}
      {emergencies.map(sos => (
        <div key={sos.id} className="bg-red-600 rounded-3xl p-4 mb-4 flex items-center justify-between text-white shadow-xl">
          <div className="flex items-center gap-4">
            <Target size={24} className="animate-pulse" />
            <div>
              <p className="font-black uppercase text-xs">SOS Received</p>
              <p className="text-xs">{sos.volunteerName} - {sos.location}</p>
            </div>
          </div>
          <button onClick={() => updateDoc(doc(db, 'emergencies', sos.id), { status: 'resolved' })} className="bg-white text-red-600 px-4 py-2 rounded-xl text-xs font-bold">Acknowledge</button>
        </div>
      ))}

      {/* Header */}
      <div className="flex justify-between items-center mb-8 p-6 bg-theme-surface rounded-2xl shadow-sm">
        <h1 className="text-3xl font-black text-theme-text">Welcome, <span className="text-indigo-600">{adminName}</span></h1>
        <div className="flex gap-3">
          <button onClick={generateStrategy} disabled={isGenerating} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-bold shadow-lg">
            <Sparkles size={18} /> {isGenerating ? "Analyzing..." : "AI Insight"}
          </button>
          <button onClick={handleLogout} className="p-2.5 rounded-2xl text-slate-500 hover:text-red-500"><LogOut size={20} /></button>
        </div>
      </div>

      {/* AI Strategy Display */}
      {aiResponse && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-red-50 p-5 border-l-4 border-red-500 rounded-2xl">
            <h3 className="font-black text-[10px] text-red-600 uppercase tracking-widest mb-2">🚨 Urgent</h3>
            {aiResponse.urgent.map((i, idx) => <p key={idx} className="text-xs text-red-900 mb-1">• {i}</p>)}
          </div>
          <div className="bg-amber-50 p-5 border-l-4 border-amber-500 rounded-2xl">
            <h3 className="font-black text-[10px] text-amber-600 uppercase tracking-widest mb-2">🆘 Help</h3>
            {aiResponse.help_seekers.map((i, idx) => <p key={idx} className="text-xs text-amber-900 mb-1">• {i}</p>)}
          </div>
          <div className="bg-emerald-50 p-5 border-l-4 border-emerald-500 rounded-2xl">
            <h3 className="font-black text-[10px] text-emerald-600 uppercase tracking-widest mb-2">🤝 Volunteers</h3>
            {aiResponse.volunteers.map((i, idx) => <p key={idx} className="text-xs text-emerald-900 mb-1">• {i}</p>)}
          </div>
          <div className="bg-indigo-50 p-5 border-l-4 border-indigo-500 rounded-2xl">
            <h3 className="font-black text-[10px] text-indigo-600 uppercase tracking-widest mb-2">⚡ Actions</h3>
            {aiResponse.actions.map((i, idx) => <p key={idx} className="text-xs text-indigo-900 mb-1">• {i}</p>)}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ActiveTeam />
        <div className="bg-theme-surface p-8 rounded-[2.5rem] shadow-sm">
          <h2 className="text-xl font-black mb-6 text-theme-text flex items-center gap-2"><Users className="text-indigo-500" /> Applications</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {volunteers.map(vol => (
              <div key={vol.id} className="flex justify-between items-center p-4 bg-theme-base rounded-2xl border border-slate-100">
                <div className="text-left">
                  <p className="font-bold text-theme-text text-sm">{vol.name}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{vol.location || 'Nagpur'}</p>
                </div>
                <div className="flex gap-2">
                  {vol.status !== 'approved' && <button onClick={() => handleApproveVolunteer(vol)} className="p-2 bg-emerald-500 text-white rounded-lg"><CheckCircle size={16} /></button>}
                  <button onClick={() => handleRemoveItem('volunteers', vol.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-theme-surface p-8 rounded-[2.5rem] shadow-sm">
          <h2 className="text-xl font-black mb-6 text-theme-text flex items-center gap-2"><MessageSquare className="text-teal-500" /> Messages</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {messages.map(msg => (
              <div key={msg.id} className="p-4 bg-theme-base rounded-2xl border border-slate-100 relative group">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{msg.name}</p>
                <p className="text-xs text-slate-700 italic">"{msg.message}"</p>
                <button onClick={() => handleRemoveItem('messages', msg.id)} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all text-slate-300 hover:text-red-500"><XCircle size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CMS Section */}
      <div className="mt-12 bg-theme-surface p-8 rounded-[2.5rem] border border-slate-100">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-theme-text"><Heart className="text-rose-500" /> CMS Gallery</h2>
        <form onSubmit={handleAddRecentWork} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input required value={workTitle} onChange={e => setWorkTitle(e.target.value)} className="bg-theme-base p-3 rounded-xl border border-slate-200 text-sm" placeholder="Title" />
          <input required value={workDesc} onChange={e => setWorkDesc(e.target.value)} className="bg-theme-base p-3 rounded-xl border border-slate-200 text-sm" placeholder="Description" />
          <input id="workImageInput" type="file" accept="image/*" required onChange={e => setWorkFile(e.target.files[0])} className="text-xs p-2" />
          <button type="submit" disabled={isUploading} className="bg-slate-900 text-white font-bold rounded-xl">{isUploading ? '...' : 'Publish'}</button>
        </form>
      </div>
    </div>
  );
}
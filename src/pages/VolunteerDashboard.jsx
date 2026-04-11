import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, increment, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { CheckCircle, MapPin, Award, User, Phone, Activity, BookOpen, AlertCircle, Trophy, Camera, AlertOctagon, XCircle } from 'lucide-react';

export default function VolunteerDashboard() {
  const [user, setUser] = useState(null);
  const [volunteerDoc, setVolunteerDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  // Profile form state
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [education, setEducation] = useState('');
  const [expertise, setExpertise] = useState('');

  // Proof of Work State
  const [selectedTaskForProof, setSelectedTaskForProof] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sosActive, setSosActive] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser?.email) {
        setUser(currentUser);
        await fetchVolunteerProfile(currentUser.email);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Leaderboard Fetch
    const q = query(
      collection(db, 'volunteers'),
      where('status', '==', 'approved'),
      orderBy('credits', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setLeaderboard(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      if (error.code === 'failed-precondition') {
        const fallbackQ = query(collection(db, 'volunteers'), where('status', '==', 'approved'));
        onSnapshot(fallbackQ, (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          docs.sort((a, b) => (b.credits || 0) - (a.credits || 0));
          setLeaderboard(docs.slice(0, 10));
        });
      }
    });

    return () => unsub();
  }, []);

  const fetchVolunteerProfile = async (email) => {
    try {
      const q = query(collection(db, 'volunteers'), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        setVolunteerDoc({ id: docSnap.id, ...data });

        // Pre-fill form if some data already exists
        if (data.phone) setPhone(data.phone);
        if (data.bloodGroup) setBloodGroup(data.bloodGroup);
        if (data.education) setEducation(data.education);
        if (data.expertise) setExpertise(data.expertise);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.email || !volunteerDoc?.profileCompleted) return;

    const q = query(
      collection(db, 'tasks'),
      where('assignedToEmail', '==', user.email),
      where('status', '==', 'pending')
    );

    const unsubscribeTasks = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribeTasks();
  }, [user, volunteerDoc?.profileCompleted]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!volunteerDoc?.id) return;

    try {
      const docRef = doc(db, 'volunteers', volunteerDoc.id);
      await updateDoc(docRef, {
        phone,
        bloodGroup,
        education,
        expertise,
        profileCompleted: true
      });
      setVolunteerDoc(prev => ({
        ...prev,
        phone, bloodGroup, education, expertise, profileCompleted: true
      }));
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  const handleSOS = async () => {
    if (window.confirm("CRITICAL: Deploying SOS will lock your coordinates and alert all priority admin channels. Proceed?")) {
      try {
        setSosActive(true);
        await addDoc(collection(db, 'emergencies'), {
          volunteerName: volunteerDoc.name || user.email,
          volunteerEmail: user.email,
          location: volunteerDoc.location || 'Unknown Sector',
          phone: volunteerDoc.phone || 'Unknown',
          status: 'critical',
          timestamp: serverTimestamp()
        });
        alert("SOS Signal Transmitted! Secure your location.");
      } catch (err) {
        console.error("SOS Dispatch Failed:", err);
      } finally {
        setSosActive(false);
      }
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

  const submitProofAndComplete = async (e) => {
    e.preventDefault();
    if (!volunteerDoc?.id || !selectedTaskForProof || !proofFile) return;

    try {
      setIsUploading(true);
      const base64Image = await convertToBase64(proofFile);

      // 1. Update Task with Image Signature
      await updateDoc(doc(db, 'tasks', selectedTaskForProof.id), {
        status: 'completed',
        completionImage: base64Image
      });

      // 2. Award Credits
      await updateDoc(doc(db, 'volunteers', volunteerDoc.id), {
        credits: increment(selectedTaskForProof.points || 10)
      });

      setVolunteerDoc(prev => ({ ...prev, credits: (prev.credits || 0) + (selectedTaskForProof.points || 10) }));
      
      // Clear Protocol
      setSelectedTaskForProof(null);
      setProofFile(null);
    } catch (err) {
      console.error("Proof initialization error:", err);
      alert("Failed to establish proof connection.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-theme-base transition-colors duration-300 flex items-center justify-center text-slate-500 font-medium">Loading Dashboard...</div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-theme-base transition-colors duration-300 flex items-center justify-center text-slate-500 font-medium">Please log in to view your dashboard.</div>;
  }

  if (!volunteerDoc) {
    return <div className="min-h-screen bg-theme-base transition-colors duration-300 flex items-center justify-center text-slate-500 font-medium">No approved volunteer record found for {user.email}. Please apply first.</div>;
  }

  const needsProfileUpdate = !volunteerDoc.bloodGroup || !volunteerDoc.expertise || !volunteerDoc.profileCompleted;

  return (
    <div className="min-h-screen bg-theme-base transition-colors duration-300 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-theme-text tracking-tight">SewaSync <span className="text-indigo-600">Volunteer</span></h1>
            <p className="text-slate-500 text-sm font-semibold uppercase flex items-center gap-1 mt-1">
              <User size={14} /> Welcome back, {volunteerDoc.name || user.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
               onClick={handleSOS}
               disabled={sosActive}
               className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white transition-all duration-300 px-4 py-2 rounded-2xl shadow-sm border border-red-100 hover:border-red-600 flex items-center gap-2 group disabled:opacity-50"
            >
               <AlertOctagon size={20} className={sosActive ? 'animate-spin' : 'animate-pulse group-hover:animate-none'} />
               <div className="text-left hidden sm:block">
                  <p className="font-black text-xs leading-none">SYS/SOS</p>
               </div>
            </button>
            <div className="bg-theme-surface transition-colors duration-300 px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-500">
                <Award size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Credits</p>
                <p className="font-black text-theme-text leading-none">{volunteerDoc.credits || 0}</p>
              </div>
            </div>
          </div>
        </header>

        {needsProfileUpdate ? (
          /* PHASE 1: DEEP PROFILE ONBOARDING */
          <div className="bg-theme-surface transition-colors duration-300 rounded-[2rem] p-8 shadow-sm border border-slate-100 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-50">
              <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 shadow-inner">
                <AlertCircle size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black text-theme-text">Complete Your Setup</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">We need a bit more info to match you with the right missions.</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-black tracking-widest uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                    <Phone size={12} /> Phone Number
                  </label>
                  <input
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-theme-base transition-colors duration-300 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3.5 outline-none transition-all font-medium text-slate-700"
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black tracking-widest uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                    <Activity size={12} /> Blood Group
                  </label>
                  <select
                    required
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full bg-theme-base transition-colors duration-300 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3.5 outline-none transition-all font-medium text-slate-700 appearance-none"
                  >
                    <option value="">Select...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black tracking-widest uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                  <BookOpen size={12} /> Education Level
                </label>
                <input
                  required
                  value={education}
                  onChange={e => setEducation(e.target.value)}
                  className="w-full bg-theme-base transition-colors duration-300 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3.5 outline-none transition-all font-medium text-slate-700"
                  placeholder="e.g. Undergraduate, High School"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black tracking-widest uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                  <Award size={12} /> Primary Expertise
                </label>
                <select
                  required
                  value={expertise}
                  onChange={e => setExpertise(e.target.value)}
                  className="w-full bg-theme-base transition-colors duration-300 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-3.5 outline-none transition-all font-medium text-slate-700 appearance-none"
                >
                  <option value="">Select your strong suit...</option>
                  <option value="Medical">Medical / First Aid</option>
                  <option value="Rescue">Search & Rescue</option>
                  <option value="Logistics">Logistics & Supply</option>
                  <option value="Counseling">Psychological Counseling</option>
                  <option value="General">General Support</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-indigo-200/50 mt-4 active:scale-[0.98]"
              >
                Save Profile & Unlock Missions
              </button>
            </form>
          </div>
        ) : (
          /* PHASE 2: DASHBOARD LAYOUT */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* THE MISSION BOARD */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-xl font-black text-theme-text flex items-center gap-2">
                  <Activity className="text-indigo-500" /> Active Missions
                </h2>
                <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{tasks.length} Pending</span>
              </div>

              {tasks.length === 0 ? (
                <div className="bg-theme-surface transition-colors duration-300 p-12 rounded-[2rem] text-center border border-slate-100 shadow-sm">
                  <div className="bg-theme-base transition-colors duration-300 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-slate-300">
                    <CheckCircle size={40} />
                  </div>
                  <h3 className="text-lg font-black text-slate-700">You're all caught up!</h3>
                  <p className="text-slate-500 mt-2 font-medium">Check back later for new mission assignments.</p>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {tasks.map(task => (
                    <div key={task.id} className="bg-theme-surface transition-colors duration-300 rounded-3xl p-6 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>

                      <div className="flex justify-between items-start mb-4">
                        <div className="pr-4">
                          <h3 className="font-bold text-theme-text text-lg leading-tight mb-1">{task.title}</h3>
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">
                            <MapPin size={12} className="text-indigo-400" /> {task.location || 'Location Not Specified'}
                          </div>
                        </div>
                        <div className="bg-amber-100 text-amber-600 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0">
                          <Award size={14} /> +{task.points || 10}
                        </div>
                      </div>

                      <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                        {task.description || "You have been assigned to this mission. Please coordinate with the team leader for further action details."}
                      </p>

                      <button
                        onClick={() => setSelectedTaskForProof(task)}
                        className="w-full bg-theme-base transition-colors duration-300 hover:bg-theme-text text-theme-text opacity-70 hover:opacity-100 hover:text-theme-base font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200/10 hover:border-transparent group/btn uppercase tracking-widest text-[10px]"
                      >
                        <Camera size={16} className="text-theme-primary group-hover/btn:text-theme-base" /> Initiate Verification
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* THE LEADERBOARD */}
            <div className="lg:col-span-1">
              <div className="bg-theme-surface transition-colors duration-300 rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col h-full">
                <h2 className="text-xl font-black text-theme-text mb-6 flex items-center gap-2">
                  <Trophy className="text-amber-500" /> Top Volunteers
                </h2>

                <div className="flex flex-col gap-3">
                  {leaderboard.map((vol, index) => {
                    const isSelf = vol.email === user?.email;

                    return (
                      <div
                        key={vol.id}
                        className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${isSelf
                            ? 'bg-indigo-50 border-indigo-200 shadow-sm relative overflow-hidden'
                            : 'bg-theme-base transition-colors duration-300 border-slate-100 hover:border-slate-200'
                          }`}
                      >
                        {isSelf && <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500"></div>}
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex justify-center items-center font-black text-sm shrink-0
                            ${index === 0 ? 'bg-amber-100 text-amber-600' :
                              index === 1 ? 'bg-slate-200 text-slate-600' :
                                index === 2 ? 'bg-orange-100 text-orange-600' :
                                  isSelf ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-400'}`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <h3 className={`font-bold leading-tight ${isSelf ? 'text-indigo-900' : 'text-theme-text'} line-clamp-1`}>
                              {vol.name} {isSelf && <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded ml-1 uppercase font-black tracking-widest leading-none align-middle inline-block">(You)</span>}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{vol.expertise || 'General'}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`text-sm font-black flex items-center justify-end gap-1 ${isSelf ? 'text-indigo-600' : 'text-amber-500'}`}>
                            {vol.credits || 0} <Award size={12} />
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* PROOF OF WORK MODAL LAYER */}
      {selectedTaskForProof && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-theme-surface w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300 p-8 border border-slate-200/5">
               <button 
                  onClick={() => { setSelectedTaskForProof(null); setProofFile(null); }}
                  className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors"
               >
                  <XCircle size={28} />
               </button>

               <div className="flex items-center gap-3 mb-6 pb-6 border-b border-theme-base">
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                     <Camera size={28} />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-theme-text">Proof of Work</h2>
                     <p className="text-[10px] font-black tracking-widest uppercase text-theme-primary mt-1">Verification Required</p>
                  </div>
               </div>

               <p className="text-theme-text opacity-70 mb-6 font-medium leading-relaxed text-sm">
                  To finalize <span className="font-bold text-theme-text">"{selectedTaskForProof.title}"</span> and unlock your <span className="font-bold text-amber-500">{selectedTaskForProof.points}</span> Credits, establish visual proof of task completion.
               </p>

               <form onSubmit={submitProofAndComplete} className="flex flex-col gap-6">
                  <div>
                     <label className="block text-[10px] font-black tracking-widest uppercase text-theme-text opacity-50 mb-2">Completion Image Upload</label>
                     <input 
                        type="file" 
                        accept="image/*"
                        required 
                        onChange={e => setProofFile(e.target.files[0])} 
                        className="w-full bg-theme-base border border-theme-base rounded-2xl outline-none text-sm font-bold text-theme-text transition-all file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-theme-text file:text-theme-base hover:file:opacity-80 placeholder:text-slate-400 cursor-pointer shadow-inner p-2" 
                     />
                  </div>

                  <button 
                     type="submit" 
                     disabled={isUploading}
                     className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl hover:brightness-110 shadow-lg shadow-emerald-500/30 flex justify-center items-center gap-2 disabled:bg-slate-400 disabled:shadow-none transition-all uppercase tracking-widest text-xs"
                  >
                     {isUploading ? 'Validating Telemetry...' : 'Submit Evidence'}
                  </button>
               </form>

            </div>
         </div>
      )}

    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Map as MapIcon, Target, CheckCircle, Clock, User } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Geospatial lookup for Tasks (Strict Sub-Areas)
const locationCoords = {
  't point': [21.388, 79.328],
  'shitalwadi': [21.392, 79.335],
  'nagardhan': [21.345, 79.315],
  'station road': [21.398, 79.323],
  'gandhi chowk': [21.395, 79.328],
  'kits area': [21.411, 79.344],
  'sonegaon': [21.100, 79.055],
  'sitabuldi': [21.145, 79.088],
  'dharampeth': [21.140, 79.060],
  'itwari': [21.155, 79.110],
  'ramtek station': [21.3980, 79.3230], // legacy
  'near kits': [21.4110, 79.3440], // legacy
  'mansar': [21.3700, 79.2550], // legacy
  'nagpur city': [21.145, 79.088] // legacy
};

// Map Recenter Helper 
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.5 });
  }, [center, map]);
  return null;
}

// Custom Marker Engine
const createMarkerIcon = (status) => {
  const isCompleted = status === 'completed';
  const color = isCompleted ? '#10b981' : '#f97316'; // Emerald vs Orange
  const shadowUrl = isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(249, 115, 22, 0.4)';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="
      background-color: ${color}; 
      width: 18px; 
      height: 18px; 
      border-radius: 50%; 
      border: 3px solid white; 
      box-shadow: 0 0 10px ${shadowUrl};
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export default function MissionMap() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([21.396, 79.323]); // Default to Ramtek
  const [selectedArea, setSelectedArea] = useState('ramtek');

  useEffect(() => {
    // Connect to the 'tasks' collection
    const unsubscribe = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const allTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(allTasks);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAreaChange = (e) => {
    const area = e.target.value;
    setSelectedArea(area);
    if (area === 'ramtek') setMapCenter([21.396, 79.323]);
    if (area === 'mansar') setMapCenter([21.370, 79.255]);
    if (area === 'nagpur') setMapCenter([21.145, 79.088]);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto bg-theme-base min-h-[80vh] rounded-[2.5rem] transition-colors duration-300">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-theme-text tracking-tight animate-in fade-in slide-in-from-left-4">Mission Map</h1>
          <p className="opacity-70 font-bold text-xs uppercase mt-2 flex items-center gap-1 text-theme-text">
            <Target size={14} className="text-theme-primary" /> Tracking {tasks.length} Live Operations
          </p>
        </div>

        {/* Operational Area Dropdown */}
        <div className="bg-theme-surface p-3 rounded-2xl border border-theme-primary/20 shadow-sm flex items-center gap-3 w-full md:w-auto transition-colors duration-300">
           <MapIcon size={18} className="text-theme-primary" />
           <select 
              value={selectedArea}
              onChange={handleAreaChange}
              className="bg-transparent border-none outline-none font-bold text-theme-text text-sm cursor-pointer focus:ring-0"
           >
              <option value="ramtek">Ramtek (Central)</option>
              <option value="mansar">Mansar</option>
              <option value="nagpur">Nagpur City</option>
           </select>
        </div>
      </div>

      {/* THE MAP INTEGRATION */}
      <div className="mb-12 bg-theme-surface p-4 rounded-3xl border-2 border-theme-primary shadow-xl overflow-hidden shadow-theme-primary/10 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="h-[500px] rounded-2xl overflow-hidden relative z-0 ring-1 ring-slate-200 shadow-inner">
          
          {loading ? (
             <div className="w-full h-full flex justify-center items-center bg-theme-base/50">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
             </div>
          ) : (
            <MapContainer 
              center={mapCenter} 
              zoom={13} 
              scrollWheelZoom={false} 
              className="w-full h-full"
            >
              <MapRecenter center={mapCenter} />
              
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {tasks.map(task => {
                // Safely convert text to lowercase to search dictionary
                const locKey = task.location ? String(task.location).toLowerCase().trim() : '';
                const coords = locationCoords[locKey];
                
                if (coords) {
                  const isCompleted = task.status === 'completed';

                  return (
                    <Marker position={coords} key={task.id} icon={createMarkerIcon(task.status)}>
                      <Popup className="font-sans">
                        <div className="text-left py-1 w-48">
                          <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mb-1 border-b border-slate-100 pb-1">
                             1 Task Assigned here
                          </p>
                          <h3 className="font-black text-slate-800 text-sm leading-tight mb-2 pt-1">{task.title || 'Untitled Mission'}</h3>
                          
                          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-3">
                            <User size={12} className="text-indigo-500"/> 
                            <span className="truncate">{task.assignedToEmail || 'Unassigned'}</span>
                          </div>
  
                          {isCompleted ? (
                             <div className="bg-emerald-50 text-emerald-600 font-bold text-xs py-1.5 px-2 rounded flex justify-center items-center gap-1 w-full border border-emerald-100">
                                <CheckCircle size={14} /> Mission Accomplished
                             </div>
                          ) : (
                             <div className="bg-orange-50 text-orange-600 font-bold text-xs py-1.5 px-2 rounded flex justify-center items-center gap-1 w-full border border-orange-100">
                                <Clock size={14} /> Pending Operation
                             </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}

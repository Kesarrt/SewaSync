import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, Users, Settings, Activity, PieChart, Globe } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="fixed left-0 top-0 h-full w-20 bg-theme-surface transition-colors duration-300 flex flex-col items-center py-6 shadow-xl z-50">
      {/* Brand Icon */}
      <NavLink to="/dashboard" className="w-10 h-10 bg-brand-teal rounded-lg flex items-center justify-center text-white font-bold text-xl mb-10 shadow-lg hover:bg-brand-teal-light hover:text-brand-teal transition-colors">
        <Activity size={24} />
      </NavLink>

      {/* Navigation Icons using NavLink to automatically handle active states */}
      <nav className="flex flex-col gap-6 flex-1">
        <NavItem to="/admin/dashboard" icon={<Home size={24} />} title="Dashboard" />
        <NavItem to="/admin/tasks" icon={<FileText size={24} />} title="Tasks" />
        <NavItem to="/admin/volunteers" icon={<Users size={24} />} title="Volunteers" />
        <NavItem to="/admin/analytics" icon={<PieChart size={24} />} title="Analytics" />
      </nav>

      {/* Bottom Icons */}
      <div className="mt-auto flex flex-col gap-6">
        <NavItem to="/public" icon={<Globe size={24} />} title="Public View" />
        <NavItem to="/admin/settings" icon={<Settings size={24} />} title="Settings" />
      </div>
    </div>
  );
}

function NavItem({ to, icon, title }) {
  // NavLink provides an 'isActive' boolean to the className function
  // This allows us to style the active route automatically
  return (
    <NavLink 
      to={to}
      title={title}
      className={({ isActive }) => 
        `p-3 rounded-xl cursor-pointer transition-all duration-200 block ${
          isActive 
            ? 'bg-indigo-600/30 text-white' 
            : 'text-slate-400 hover:text-white hover:bg-theme-surface transition-colors duration-300/10'
        }`
      }
    >
      {icon}
    </NavLink>
  );
}

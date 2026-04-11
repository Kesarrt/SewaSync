import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-theme-base flex items-center justify-center p-6 transition-colors duration-300">
      <div className="bg-theme-surface max-w-lg w-full text-center p-12 rounded-[3.5rem] shadow-xl border border-slate-200/10">
        <div className="bg-red-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-theme-surface shadow-inner text-red-500">
          <AlertTriangle size={48} />
        </div>
        <h1 className="text-5xl font-black text-theme-text tracking-tight mb-4">Mission Lost</h1>
        <p className="text-theme-text opacity-70 font-medium mb-10 text-lg leading-relaxed">
          The operational sector you are looking for does not exist or has been relocated.
        </p>
        <Link to="/" className="inline-flex items-center gap-2 bg-theme-text text-theme-base px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-80 transition-opacity shadow-lg shadow-black/10">
          <ArrowLeft size={16} /> Return to Base
        </Link>
      </div>
    </div>
  );
}

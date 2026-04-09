import React from 'react';
import Sidebar from '../components/Sidebar';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-brand-background flex">
      <Sidebar />
      {/* Main Content wrapper with left padding to account for fixed Sidebar */}
      <main className="flex-1 ml-20">
        <div className="max-w-7xl mx-auto py-8 px-8 xl:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}

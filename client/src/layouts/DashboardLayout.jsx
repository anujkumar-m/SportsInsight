import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';

const DashboardLayout = ({ children, title, subtitle }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="lg:pl-72 flex min-h-screen flex-1 flex-col transition-all duration-200">
        <Navbar title={title} subtitle={subtitle} onMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;


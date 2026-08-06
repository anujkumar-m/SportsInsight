import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';

const DashboardLayout = ({ children, title, subtitle }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="lg:pl-72">
        <Navbar title={title} subtitle={subtitle} onMenuOpen={() => setMobileOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;


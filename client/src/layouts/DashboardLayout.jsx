import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import Navbar, { PageHeader } from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ children, title, subtitle }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="lg:pl-72">
        <Navbar title={title} subtitle={subtitle} onMenuOpen={() => setMobileOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <PageHeader title={title} subtitle={subtitle} role={role} />
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

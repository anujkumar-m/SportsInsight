import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';

const DashboardLayout = ({ children, title, subtitle }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen min-h-dvh bg-background flex flex-col antialiased overflow-x-hidden w-full">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      {/* On mobile: no left padding (sidebar is a drawer overlay).
          On lg+: shift content right by the sidebar width (18rem = w-72). */}
      <div className="lg:pl-72 flex min-h-screen min-h-dvh flex-1 flex-col transition-all duration-200 w-full overflow-x-hidden">
        <Navbar title={title} subtitle={subtitle} onMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 w-full overflow-x-hidden px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;


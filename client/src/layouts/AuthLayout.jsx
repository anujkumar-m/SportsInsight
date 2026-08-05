import React from 'react';

/**
 * Simple centered auth shell for Forgot / Reset password pages.
 * Login uses its own split layout and does not use this.
 */
const AuthLayout = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center bg-bg p-4 relative overflow-hidden">
    <div
      className="absolute inset-0 pointer-events-none opacity-40"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(37,99,235,0.08), transparent 40%), radial-gradient(circle at 80% 80%, rgba(34,197,94,0.05), transparent 40%)',
      }}
    />
    <div className="relative z-10 w-full max-w-md">{children}</div>
  </div>
);

export default AuthLayout;

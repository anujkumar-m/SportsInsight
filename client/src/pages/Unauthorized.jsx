import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        <div className="w-20 h-20 bg-red-50 rounded-full mx-auto flex items-center justify-center mb-6">
          <ShieldAlert size={40} className="text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Access Denied
        </h1>
        
        <p className="text-gray-500 mb-8">
          You do not have permission to view this page. Please contact your administrator if you believe this is an error.
        </p>
        
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary w-full justify-center"
        >
          <ArrowLeft size={18} />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;

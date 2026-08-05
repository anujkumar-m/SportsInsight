import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="ui-card max-w-md w-full p-8 text-center fade-in">
        <div className="w-14 h-14 bg-red-50 rounded-xl mx-auto flex items-center justify-center mb-6 text-danger">
          <ShieldAlert size={28} />
        </div>
        <h1 className="section-title mb-2">Access Denied</h1>
        <p className="text-small text-muted mb-8">
          You do not have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
        <Button variant="primary" className="w-full" leftIcon={ArrowLeft} onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;

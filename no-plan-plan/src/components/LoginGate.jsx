import React from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

const LoginGate = () => {
  const { signIn } = useAuth();
  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
      <p className="text-center">Please log in to access this page.</p>
      <button className="btn btn-primary" onClick={signIn}>Login</button>
    </div>
  );
};

export default LoginGate; 
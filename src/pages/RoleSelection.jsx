import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RoleSelector from '../components/RoleSelector';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser, setUserRoleInDB } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
  };

  const handleConfirmRole = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Update role in Firestore and Context
      await setUserRoleInDB(selectedRole);
      navigate('/');
    } catch (err) {
      console.error('Error setting role:', err);
      setError('Failed to set role: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-2s' }}></div>
      </div>

      <div className="w-full max-w-lg relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Complete Your Profile</h2>
          <p className="text-gray-400">Select your role to personalize your experience</p>
        </div>

        <div className="glass-card p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/10 backdrop-blur-xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-4 rounded-xl mb-6 flex items-start gap-3 animate-fade-in">
              <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <RoleSelector selectedRole={selectedRole} onSelect={handleRoleSelect} />

            <button
              onClick={handleConfirmRole}
              disabled={loading || !selectedRole}
              className={`btn-primary w-full py-3.5 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 ${
                !selectedRole ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;

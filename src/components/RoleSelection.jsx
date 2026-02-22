import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser, setUserRoleInDB } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    // Validate student-specific fields
    if (selectedRole === 'student') {
      if (!phone || !college) {
        setError('Phone number and college are required for students');
        return;
      }
      if (phone.length < 10) {
        setError('Please enter a valid phone number');
        return;
      }
    }

    try {
      setError('');
      setLoading(true);
      
      console.log('Updating user role to:', selectedRole);
      console.log('Current user:', currentUser);
      
      // Update user document with role and student-specific fields
      const updateData = {
        role: selectedRole,
        roleSetAt: new Date().toISOString(),
        // Preserve name from auth if not already in Firestore
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User'
      };

      if (selectedRole === 'student') {
        updateData.phone = phone;
        updateData.college = college;
      }

      console.log('Update data:', updateData);

      await setDoc(doc(db, 'users', currentUser.uid), updateData, { merge: true });
      
      console.log('User document updated successfully');
      
      await setUserRoleInDB(selectedRole);
      
      navigate('/');
    } catch (error) {
      console.error('Error setting role:', error);
      setError('Failed to set role: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-primary to-secondary py-8 sm:py-12 px-3 sm:px-4 lg:px-8">
      <div className="max-w-sm sm:max-w-md w-full bg-white rounded-lg shadow-xl p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Welcome to Festify!
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-600">
            Please select your role to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-3 sm:mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="label">I am a</label>
            <div className="space-y-2 sm:space-y-3">
              <div
                onClick={() => setSelectedRole('student')}
                className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition duration-200 ${
                  selectedRole === 'student'
                    ? 'border-primary bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="student"
                    name="role"
                    value="student"
                    checked={selectedRole === 'student'}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mr-2 sm:mr-3 h-4 w-4 flex-shrink-0"
                  />
                  <div>
                    <label htmlFor="student" className="font-semibold text-gray-900 cursor-pointer text-sm sm:text-base">
                      Student
                    </label>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Discover and register for college fests
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setSelectedRole('organizer')}
                className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition duration-200 ${
                  selectedRole === 'organizer'
                    ? 'border-primary bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="organizer"
                    name="role"
                    value="organizer"
                    checked={selectedRole === 'organizer'}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mr-2 sm:mr-3 h-4 w-4 flex-shrink-0"
                  />
                  <div>
                    <label htmlFor="organizer" className="font-semibold text-gray-900 cursor-pointer text-sm sm:text-base">
                      Organizer
                    </label>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Create and promote college fests
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional fields for students */}
          {selectedRole === 'student' && (
            <div className="space-y-3 sm:space-y-4 animate-fadeIn">
              <div>
                <label htmlFor="phone" className="label">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="input-field"
                  placeholder="1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="college" className="label">
                  College/University <span className="text-red-500">*</span>
                </label>
                <input
                  id="college"
                  name="college"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Enter your college name"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedRole}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed py-2.5 sm:py-3 text-sm sm:text-base"
          >
            {loading ? 'Setting Role...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleSelection;

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchUserProfile();
    }
  }, [currentUser]);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching profile for user:', currentUser.uid);
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      console.log('User document exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        console.log('User data from Firestore:');
        console.log('  - name:', userData.name);
        console.log('  - email:', userData.email);
        console.log('  - phone:', userData.phone);
        console.log('  - college:', userData.college);
        console.log('  - role:', userData.role);
        console.log('currentUser.displayName:', currentUser.displayName);
        console.log('currentUser.email:', currentUser.email);
        
        const finalName = userData.name || currentUser.displayName || '';
        console.log('Final name to be used:', finalName);
        
        setFormData({
          name: finalName,
          email: userData.email || currentUser.email || '',
          phone: userData.phone || '',
          college: userData.college || ''
        });
        
        console.log('Form data after setting:');
        console.log('  - formData.name:', finalName);
        console.log('  - formData.email:', userData.email || currentUser.email || '');
        console.log('  - formData.phone:', userData.phone || '');
        console.log('  - formData.college:', userData.college || '');
      } else {
        console.log('User document does not exist in Firestore');
        // If document doesn't exist, use auth data
        setFormData({
          name: currentUser.displayName || '',
          email: currentUser.email || '',
          phone: '',
          college: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.college) {
      setMessage('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: formData.name,
        phone: formData.phone,
        college: formData.college
      });
      setMessage('Profile updated successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-2xl mx-auto px-3 sm:px-4">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <button onClick={() => navigate('/dashboard')} className="text-primary hover:text-primary/80 inline-flex items-center gap-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>
        
        <div className="glass-container p-4 sm:p-6 border border-white/10">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">Update your personal information</p>

          {message && (
            <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border ${
              message.includes('success') 
                ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="input-field opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="phone" className="label">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="input-field"
                required
              />
            </div>

            <div>
              <label htmlFor="college" className="label">
                College/University <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="college"
                name="college"
                value={formData.college}
                onChange={handleChange}
                placeholder="Enter your college name"
                className="input-field"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 btn-primary disabled:opacity-50 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 btn-secondary px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

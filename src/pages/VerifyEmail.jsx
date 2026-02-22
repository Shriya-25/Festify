import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const VerifyEmail = () => {
  const { currentUser, reloadUser, resendVerificationEmail, logout } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // If no user, redirect to login
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.emailVerified) {
      // If already verified, redirect to home
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleCheckVerification = async () => {
    try {
      setChecking(true);
      setError('');
      setMessage('');
      
      const updatedUser = await reloadUser();
      
      if (updatedUser && updatedUser.emailVerified) {
        setMessage('✓ Email verified successfully! Setting up your account...');
        
        // Check if user has a role set
        const userDoc = await getDoc(doc(db, 'users', updatedUser.uid));
        const userData = userDoc.data();
        
        if (!userData.role) {
          // Redirect to role selection
          setTimeout(() => {
            navigate('/role-selection');
          }, 1000);
        } else {
          // Role already set, go to home
          setTimeout(() => {
            navigate('/');
          }, 1000);
        }
      } else {
        setError('❌ Email not verified yet. Please check your inbox and click the verification link before proceeding.');
      }
    } catch (error) {
      setError('Failed to check verification status: ' + error.message);
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setResending(true);
      setError('');
      setMessage('');
      
      await resendVerificationEmail();
      setMessage('✓ Verification email sent! Please check your inbox (and spam folder).');
    } catch (error) {
      if (error.message.includes('too-many-requests')) {
        setError('Too many requests. Please wait a few minutes before trying again.');
      } else {
        setError('Failed to send verification email: ' + error.message);
      }
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-primary to-secondary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-sm text-gray-600">
            We've sent a verification link to
          </p>
          <p className="text-sm font-semibold text-gray-800 mt-1">
            {currentUser?.email}
          </p>
        </div>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📬 Check Your Email</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Open your email inbox</li>
              <li>• Look for an email from Firebase</li>
              <li>• Click the verification link</li>
              <li>• Return here and click "I've Verified"</li>
            </ul>
          </div>

          <button
            onClick={handleCheckVerification}
            disabled={checking}
            className="btn-primary w-full"
          >
            {checking ? 'Checking...' : '✓ I\'ve Verified My Email'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Didn't receive the email?</span>
            </div>
          </div>

          <button
            onClick={handleResendEmail}
            disabled={resending}
            className="btn-secondary w-full"
          >
            {resending ? 'Sending...' : '📧 Resend Verification Email'}
          </button>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800 w-full text-center"
            >
              Logout and try a different account
            </button>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>💡 Tip: Check your spam/junk folder if you don't see the email</p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

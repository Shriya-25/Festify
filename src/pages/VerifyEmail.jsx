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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 sm:py-12 px-3 sm:px-4">
      <div className="max-w-sm sm:max-w-md w-full glass-container border border-white/10 p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-yellow-500/20 border border-yellow-500/30 mb-4">
            <svg className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Verify Your Email
          </h2>
          <p className="text-sm text-gray-300">
            We've sent a verification link to
          </p>
          <p className="text-sm font-semibold text-primary mt-1">
            {currentUser?.email}
          </p>
        </div>

        {message && (
          <div className="bg-green-500/20 border border-green-500/30 text-green-400 text-sm p-3 sm:p-4 rounded-lg mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 text-sm p-3 sm:p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-blue-400 mb-2">Check Your Email</h3>
            <ul className="text-sm text-blue-300 space-y-1">
              <li>• Open your email inbox</li>
              <li>• Look for an email from Firebase</li>
              <li>• Click the verification link</li>
              <li>• Return here and click "I've Verified"</li>
            </ul>
          </div>

          <button
            onClick={handleCheckVerification}
            disabled={checking}
            className="btn-primary w-full py-2.5 sm:py-3 text-sm sm:text-base"
          >
            {checking ? 'Checking...' : 'I\'ve Verified My Email'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/5 text-gray-300 border border-white/10 rounded-lg py-1">Didn't receive the email?</span>
            </div>
          </div>

          <button
            onClick={handleResendEmail}
            disabled={resending}
            className="btn-secondary w-full py-2.5 sm:py-3 text-sm sm:text-base"
          >
            {resending ? 'Sending...' : 'Resend Verification Email'}
          </button>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white w-full text-center transition-colors"
            >
              Logout and try a different account
            </button>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-400 text-center">
          <p>Tip: Check your spam/junk folder if you don't see the email</p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

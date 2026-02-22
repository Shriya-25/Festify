import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setMessage('');
      setLoading(true);

      // Sign in temporarily
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if already verified
      if (user.emailVerified) {
        await signOut(auth);
        setMessage('Your email is already verified! You can now login.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      // Send verification email
      await sendEmailVerification(user);

      // Sign out immediately
      await signOut(auth);

      setMessage('Verification email sent successfully! Please check your inbox (and spam folder) and then login.');
      
      // Clear form
      setEmail('');
      setPassword('');

    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a few minutes before trying again.');
      } else {
        setError('Failed to resend verification email: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 sm:py-12 px-3 sm:px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="max-w-sm sm:max-w-md w-full glass-container border border-white/10 p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-yellow-500/20 border border-yellow-500/30 mb-4">
            <svg className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Resend Verification Email
          </h2>
          <p className="text-sm text-gray-300">
            Enter your credentials to receive a new verification email
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input-field"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 sm:py-3 text-sm sm:text-base"
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm">
          <p className="text-gray-400">
            <Link to="/login" className="text-primary hover:text-indigo-400 font-semibold">
              Back to Login
            </Link>
          </p>
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:text-indigo-400 font-semibold">
              Sign up here
            </Link>
          </p>
        </div>

        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
          <p className="text-xs text-blue-300">
            <strong>Tip:</strong> Check your spam/junk folder if you don't see the email in your inbox.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResendVerification;

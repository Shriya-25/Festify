import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary">
              🎉 Festify
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <Link to="/" className="text-gray-700 hover:text-primary">
                  Home
                </Link>
                <Link to="/dashboard" className="text-gray-700 hover:text-primary">
                  Dashboard
                </Link>
                {userRole === 'organizer' && (
                  <Link to="/create-fest" className="text-gray-700 hover:text-primary">
                    Create Fest
                  </Link>
                )}
                {userRole === 'admin' && (
                  <Link to="/admin" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                    🔐 Admin Panel
                  </Link>
                )}
                <span className="text-sm text-gray-500">
                  ({userRole})
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

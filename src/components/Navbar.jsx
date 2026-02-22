import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check if user needs email verification
  const needsVerification = currentUser && !currentUser.emailVerified && currentUser.providerData[0]?.providerId === 'password';

  return (
    <nav className="navbar-glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-xl sm:text-2xl font-bold text-white tracking-tight hover:text-primary transition-colors duration-200">
              Festify
            </Link>
          </div>

          {/* Center Navigation - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-300 hover:text-white transition-colors duration-200 font-medium relative group"
            >
              Discover
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
            </Link>
            {currentUser && !needsVerification && (
              <>
                {userRole === 'organizer' && (
                  <Link 
                    to="/create-fest" 
                    className="text-gray-300 hover:text-white transition-colors duration-200 font-medium relative group"
                  >
                    Create Fest
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
                  </Link>
                )}
                {userRole === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="text-primary hover:text-orange-400 font-semibold transition-colors duration-200"
                  >
                    Admin Panel
                  </Link>
                )}
              </>
            )}
            <Link 
              to="/about" 
              className="text-gray-300 hover:text-white transition-colors duration-200 font-medium relative group"
            >
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link 
              to="/contact" 
              className="text-gray-300 hover:text-white transition-colors duration-200 font-medium relative group"
            >
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
            </Link>
          </div>

          {/* Right Side - Auth */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {currentUser ? (
              needsVerification ? (
                <>
                  <span className="text-xs sm:text-sm text-yellow-400 font-medium hidden sm:block">
                    Verify Email
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/profile" 
                    className="hidden sm:block"
                  >
                    <div className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-200 border border-white/10">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                        {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email[0].toUpperCase()}
                      </div>
                      <div className="text-left hidden lg:block">
                        <p className="text-sm text-white font-medium leading-tight">
                          {currentUser.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-400 leading-tight capitalize">{userRole}</p>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="hidden sm:block btn-secondary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                  >
                    Logout
                  </button>
                </>
              )
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white font-medium transition-colors duration-200 text-sm">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
                  Sign Up
                </Link>
              </>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10">
          <div className="px-4 pt-2 pb-3 space-y-1 bg-black/30 backdrop-blur-xl">
            <Link 
              to="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors font-medium"
            >
              Discover
            </Link>
            {currentUser && !needsVerification && (
              <>
                <Link 
                  to="/profile" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="sm:hidden block px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors font-medium"
                >
                  Profile ({userRole})
                </Link>
                {userRole === 'organizer' && (
                  <Link 
                    to="/create-fest" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors font-medium"
                  >
                    Create Fest
                  </Link>
                )}
                {userRole === 'admin' && (
                  <Link 
                    to="/admin" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-primary hover:text-orange-400 hover:bg-white/10 transition-colors font-semibold"
                  >
                    Admin Panel
                  </Link>
                )}
              </>
            )}
            <Link 
              to="/about" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors font-medium"
            >
              About
            </Link>
            <Link 
              to="/contact" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors font-medium"
            >
              Contact
            </Link>
            {currentUser && !needsVerification && (
              <button
                onClick={handleLogout}
                className="sm:hidden w-full text-left px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors font-medium"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

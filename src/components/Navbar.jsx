import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'glass-nav h-[72px]' : 'bg-transparent h-[80px]'
      }`}
    >
      <div className="container-max h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:from-primary group-hover:to-primary-light transition-all duration-300">
                Festify
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-primary group-hover:animate-ping"></div>
            </Link>
          </div>

          {/* Center Navigation - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {currentUser && !needsVerification && (
              <>
                <NavLink to="/" label="Discover" active={location.pathname === '/'} />
                <NavLink to="/dashboard" label="Dashboard" active={location.pathname === '/dashboard'} />
                
                {userRole === 'organizer' && (
                  <NavLink to="/create-fest" label="Create Fest" active={location.pathname === '/create-fest'} />
                )}
                
                {userRole === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="text-primary hover:text-primary-light font-medium transition-colors duration-200"
                  >
                    Admin Panel
                  </Link>
                )}
                
                <NavLink to="/about" label="About" active={location.pathname === '/about'} />
                <NavLink to="/contact" label="Contact" active={location.pathname === '/contact'} />
              </>
            )}
          </div>

          {/* Right Side - Auth */}
          <div className="flex items-center gap-4">
            {currentUser ? (
              needsVerification ? (
                <>
                  <span className="text-sm text-yellow-500 font-medium hidden sm:block">
                    Verify Email
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/profile" 
                    className="hidden sm:flex items-center gap-3 group"
                  >
                    <div className="text-right hidden lg:block">
                      <p className="text-sm text-white font-medium group-hover:text-primary transition-colors">
                        {currentUser.displayName || 'User'}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{userRole}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-surface border border-white/10 flex items-center justify-center text-primary font-bold shadow-lg shadow-black/20 group-hover:border-primary/50 transition-all">
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email[0].toUpperCase()}
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Logout
                  </button>
                </>
              )
            ) : (
              <>
                <Link to="/login" className="text-gray-400 hover:text-white text-sm font-medium transition-colors duration-200">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary text-sm px-6 py-2.5 shadow-glow">
                  Sign Up
                </Link>
              </>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel mx-4 mt-2 p-4 animate-fade-in border border-white/10 bg-surface/95">
          <div className="flex flex-col space-y-4">
             {currentUser && !needsVerification && (
              <>
                <Link to="/" className="text-gray-300 hover:text-primary py-2" onClick={() => setMobileMenuOpen(false)}>Discover</Link>
                <Link to="/dashboard" className="text-gray-300 hover:text-primary py-2" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                {userRole === 'organizer' && (
                  <Link to="/create-fest" className="text-gray-300 hover:text-primary py-2" onClick={() => setMobileMenuOpen(false)}>Create Fest</Link>
                )}
                {userRole === 'admin' && (
                  <Link to="/admin" className="text-primary hover:text-primary-light py-2" onClick={() => setMobileMenuOpen(false)}>Admin Panel</Link>
                )}
                 <Link to="/about" className="text-gray-300 hover:text-primary py-2" onClick={() => setMobileMenuOpen(false)}>About</Link>
                <Link to="/contact" className="text-gray-300 hover:text-primary py-2" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
                <div className="h-px bg-white/10 my-2"></div>
                <Link to="/profile" className="text-gray-300 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="text-left text-red-400 py-2">Logout</button>
              </>
             )}
             {!currentUser && (
               <>
                <Link to="/login" className="text-gray-300 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                <Link to="/signup" className="btn-primary w-full text-center" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
               </>
             )}
          </div>
        </div>
      )}
    </nav>
  );
};

const NavLink = ({ to, label, active }) => (
  <Link 
    to={to} 
    className={`relative font-medium text-sm transition-colors duration-200 ${
      active ? 'text-white' : 'text-gray-400 hover:text-white'
    }`}
  >
    {label}
    <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary rounded-full transition-all duration-300 ${
      active ? 'w-full' : 'w-0 hover:w-full'
    }`}></span>
  </Link>
);

export default Navbar;

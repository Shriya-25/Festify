import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Handle auto-collapse on non-home pages
  useEffect(() => {
    if (location.pathname !== '/') {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const NavItem = ({ to, icon, label, active }) => (
    <Link
      to={to}
      className={`relative flex items-center gap-4 px-4 py-3 my-1 rounded-xl transition-all duration-300 group
        ${active 
          ? 'bg-primary/10 text-primary' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }
        ${isCollapsed ? 'justify-center' : ''}
      `}
    >
      <span className={`material-symbols-outlined text-2xl transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      
      {/* Desktop Label (Hidden if collapsed) */}
      <span className={`hidden md:block font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
        {label}
      </span>
      
      {/* Tooltip for collapsed state (Desktop only) */}
      {isCollapsed && (
        <div className="hidden md:block absolute left-full ml-4 px-2 py-1 bg-surface-card border border-white/10 rounded-md text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
          {label}
        </div>
      )}
    </Link>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <nav 
        className={`hidden md:flex sticky top-0 h-screen flex-col bg-[#070C18] border-r border-white/5 transition-all duration-300 z-50
        ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Logo Section */}
        <div className={`flex items-center h-20 px-6 ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
          <Link to="/" className="flex items-center gap-2 group overflow-hidden">
            {isCollapsed ? (
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center font-bold text-white text-xl shadow-glow-primary">F</div>
            ) : (
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-glow-primary">F</div>
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:text-white transition-colors">
                    Festify
                  </span>
               </div>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide flex flex-col">
          <NavItem to="/" icon="home" label="Discover" active={location.pathname === '/'} />
          
          {currentUser && (
            <>
              <NavItem to="/dashboard" icon="grid_view" label="Dashboard" active={location.pathname === '/dashboard'} />
              
              {userRole === 'organizer' && (
                <NavItem to="/create-fest" icon="add_circle" label="Create Fest" active={location.pathname === '/create-fest'} />
              )}
              
              {userRole === 'admin' && (
                <NavItem to="/admin" icon="admin_panel_settings" label="Admin Panel" active={location.pathname === '/admin'} />
              )}
              
              <NavItem to="/profile" icon="person" label="Profile" active={location.pathname === '/profile'} />
            </>
          )}

          <div className="my-2 border-t border-white/5 mx-2"></div>
          
          <NavItem to="/about" icon="info" label="About" active={location.pathname === '/about'} />
          <NavItem to="/contact" icon="mail" label="Contact" active={location.pathname === '/contact'} />
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-white/5 space-y-2 bg-[#050912]">
          {currentUser ? (
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group ${isCollapsed ? 'justify-center' : ''}`}
            >
              <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">logout</span>
              
               <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                  Logout
               </span>
            </button>
          ) : (
            <>
              <NavItem to="/login" icon="login" label="Login" active={location.pathname === '/login'} />
              {!isCollapsed ? (
                <Link to="/signup" className="block w-full py-3 mt-2 bg-primary text-white text-center rounded-xl font-bold hover:bg-purple-600 transition-colors shadow-glow-primary uppercase tracking-wide text-xs">
                  Sign Up
                </Link>
              ) : (
                <NavItem to="/signup" icon="person_add" label="Sign Up" active={location.pathname === '/signup'} />
              )}
            </>
          )}

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 text-gray-500 hover:text-white transition-colors mt-1 hover:bg-white/5 rounded-lg"
          >
            <span className="material-symbols-outlined">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#070C18]/95 backdrop-blur-md border-t border-white/10 z-[100] px-6 py-3 flex justify-between items-center pb-safe">
        <Link to="/" className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-primary' : 'text-gray-400'}`}>
          <span className="material-symbols-outlined text-2xl">home</span>
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        
        {currentUser ? (
           <Link to="/dashboard" className={`flex flex-col items-center gap-1 ${location.pathname === '/dashboard' ? 'text-primary' : 'text-gray-400'}`}>
             <span className="material-symbols-outlined text-2xl">grid_view</span>
             <span className="text-[10px] font-medium">Dash</span>
           </Link>
        ) : (
           <Link to="/about" className={`flex flex-col items-center gap-1 ${location.pathname === '/about' ? 'text-primary' : 'text-gray-400'}`}>
             <span className="material-symbols-outlined text-2xl">info</span>
             <span className="text-[10px] font-medium">About</span>
           </Link>
        )}

        {/* Floating Action Button */}
         <Link to="/contact" className="relative -top-6 bg-gradient-to-br from-primary to-purple-600 text-white p-4 rounded-full shadow-[0_0_20px_rgba(58,190,255,0.5)] border-4 border-[#0A0F1F] hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-2xl">mail</span>
         </Link>

        <Link to={currentUser ? "/profile" : "/login"} className={`flex flex-col items-center gap-1 ${['/profile', '/login'].includes(location.pathname) ? 'text-primary' : 'text-gray-400'}`}>
          <span className="material-symbols-outlined text-2xl">{currentUser ? 'person' : 'login'}</span>
          <span className="text-[10px] font-medium">{currentUser ? 'Profile' : 'Login'}</span>
        </Link>
        
        {currentUser ? (
             <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-400">
               <span className="material-symbols-outlined text-2xl">logout</span>
               <span className="text-[10px] font-medium">Exit</span>
             </button>
        ) : (
             <Link to="/signup" className={`flex flex-col items-center gap-1 ${location.pathname === '/signup' ? 'text-primary' : 'text-gray-400'}`}>
               <span className="material-symbols-outlined text-2xl">person_add</span>
               <span className="text-[10px] font-medium">Sign Up</span>
             </Link>
        )}
      </nav>
    </>
  );
};

export default Navbar;

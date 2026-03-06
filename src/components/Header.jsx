import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ searchTerm, setSearchTerm, notificationContent, notificationCount = 0 }) => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  // Theme logic removed as it's handled in Sidebar/Navbar

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-fest-border px-4 lg:px-8 py-3 flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xl">search</span>
          <input 
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-card border border-fest-border focus:border-primary/50 text-text-primary placeholder:text-text-secondary focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none" 
            placeholder="Search events..." 
            type="text"
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
          />
        </div>
        {/* Mobile Logo/Menu placeholder if Sidebar is hidden */}
        <div className="lg:hidden flex items-center gap-2">
             <span className="material-symbols-outlined text-primary">auto_awesome</span>
             <span className="font-bold text-text-primary">Festify</span>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6 ml-4">
        {/* Theme Toggle Removed - Handled in Sidebar */}
        
        {currentUser ? (
             <div className="relative">
                <button 
                  className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-surface-card rounded-full transition-colors"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                    <span className="material-symbols-outlined">notifications</span>
                    {notificationCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>}
                </button>
                
                {/* Notification Popup */}
                {showNotifications && (
                  <div className="absolute top-12 right-0 w-80 bg-surface-card border border-fest-border rounded-xl shadow-2xl z-[60] overflow-hidden">
                    {notificationContent || (
                      <div className="p-4 text-center text-text-secondary text-sm">No new notifications</div>
                    )}
                  </div>
                )}

                <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-fest-border ml-2">
                    <div className="text-right">
                        <p className="text-sm font-bold leading-none text-text-primary">{currentUser.displayName || 'User'}</p>
                        <p className="text-xs text-text-secondary capitalize">{userRole || 'Student'}</p>
                    </div>
                </div>
             </div>
        ) : (
             <div className="flex items-center gap-3">
                 <Link to="/login" className="px-4 py-2 bg-surface-card text-text-primary text-sm font-bold rounded-lg border border-fest-border hover:bg-surface transition-colors">Log In</Link>
                 <Link to="/signup" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-lg transition-colors shadow-glow-primary">Sign Up</Link>
             </div>
        )}
      </div>
    </header>
  );
};

export default Header;

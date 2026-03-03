import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ searchTerm, setSearchTerm }) => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  // State to force re-render on theme change if needed, though class manipulation is direct
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleThemeToggle = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-bg-base/80 backdrop-blur-xl border-b border-white/5 px-4 lg:px-8 py-3 flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xl">search</span>
          <input 
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary/50 text-text-primary placeholder:text-text-secondary focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none" 
            placeholder="Search for events, clubs, or venues..." 
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
        <button 
            className="p-2 text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center rounded-full hover:bg-white/5" 
            id="theme-toggle"
            onClick={handleThemeToggle}
            aria-label="Toggle Dark Mode"
        >
          {/* Show Sun in Dark Mode (to switch to light) */}
          <span className={`material-symbols-outlined ${isDark ? 'block' : 'hidden'}`}>light_mode</span>
          {/* Show Moon in Light Mode (to switch to dark) */}
          <span className={`material-symbols-outlined ${isDark ? 'hidden' : 'block'}`}>dark_mode</span>
        </button>
        
        {currentUser ? (
             <>
                <button className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-full transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-neon-pink rounded-full border-2 border-bg-base"></span>
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold leading-none text-text-primary">{currentUser.displayName || 'User'}</p>
                        <p className="text-xs text-text-secondary capitalize">{userRole || 'Student'}</p>
                    </div>
                </div>
             </>
        ) : (
             <div className="flex items-center gap-3">
                 <Link to="/login" className="px-4 py-2 bg-white/5 text-text-primary text-sm font-bold rounded-lg border border-white/10 hover:bg-white/10 transition-colors">Log In</Link>
                 <Link to="/signup" className="px-4 py-2 bg-primary hover:bg-primary-end text-bg-base text-sm font-bold rounded-lg transition-colors shadow-glow-primary">Sign Up</Link>
             </div>
        )}
      </div>
    </header>
  );
};

export default Header;

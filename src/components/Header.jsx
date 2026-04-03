import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Header = ({ searchTerm, setSearchTerm }) => {
  const { currentUser } = useAuth();

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

      {!currentUser && (
        <div className="flex items-center gap-3 ml-4">
          <Link to="/login" className="px-4 py-2 bg-surface-card text-text-primary text-sm font-bold rounded-lg border border-fest-border hover:bg-surface transition-colors">Log In</Link>
          <Link to="/signup" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-lg transition-colors shadow-glow-primary">Sign Up</Link>
        </div>
      )}
    </header>
  );
};

export default Header;

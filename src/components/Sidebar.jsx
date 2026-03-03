import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { currentUser, userRole } = useAuth();

  const isActive = (path) => {
    return location.pathname === path ? 
      'bg-primary/10 text-primary font-semibold shadow-[0_0_15px_rgba(58,190,255,0.1)]' : 
      'text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors';
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-surface-sidebar border-r border-white/5 z-50 hidden lg:flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white bg-primary shadow-glow-primary">
          <span className="material-symbols-outlined">auto_awesome</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Festify</h1>
          <p className="text-xs text-slate-500">College Event Hub</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <Link to="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isActive('/')}`}>
          <span className="material-symbols-outlined">explore</span>
          <span>Explore Events</span>
        </Link>
        
        {currentUser && (
          <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isActive('/dashboard')}`}>
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </Link>
        )}

        {currentUser && (
          <Link to="/my-registrations" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isActive('/my-registrations')}`}>
            <span className="material-symbols-outlined">confirmation_number</span>
            <span>My Registrations</span>
          </Link>
        )}

        {currentUser && (
          <Link to="/saved-events" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isActive('/saved-events')}`}>
            <span className="material-symbols-outlined">bookmark</span>
            <span>Saved Events</span>
          </Link>
        )}

        {userRole === 'organizer' && (
             <>
                <div className="pt-4 pb-2">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Organizer</p>
                </div>
                <Link to="/create-fest" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isActive('/create-fest')}`}>
                    <span className="material-symbols-outlined">add_circle</span>
                    <span>Create Fest</span>
                </Link>
             </>
        )}

        {userRole === 'admin' && (
             <>
                <div className="pt-4 pb-2">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</p>
                </div>
                <Link to="/admin" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isActive('/admin')}`}>
                    <span className="material-symbols-outlined">admin_panel_settings</span>
                    <span>Admin Panel</span>
                </Link>
             </>
        )}

        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</p>
        </div>
        
        {currentUser && (
          <Link to="/profile" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isActive('/profile')}`}>
            <span className="material-symbols-outlined">person</span>
            <span>Profile</span>
          </Link>
        )}
        
        <Link to="/settings" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isActive('/settings')}`}>
          <span className="material-symbols-outlined">settings</span>
          <span>Settings</span>
        </Link>
      </nav>

      <div className="p-4 mt-auto">
      </div>
    </aside>
  );
};

export default Sidebar;

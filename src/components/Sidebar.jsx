import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => {
    // Modify active state styling for collapsed mode if needed
    const baseStyle = location.pathname === path ? 
      'bg-primary/10 text-primary font-semibold shadow-[0_0_15px_rgba(58,190,255,0.1)]' : 
      'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300 transition-colors';
    
    return `${baseStyle} ${isCollapsed ? 'justify-center px-2' : 'px-3'}`;
  };

  return (
    <aside className={`fixed inset-y-0 left-0 ${isCollapsed ? 'w-20' : 'w-64'} bg-surface-sidebar border-r border-slate-200 dark:border-white/5 z-50 hidden lg:flex flex-col transition-all duration-300`}>
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white bg-primary shadow-glow-primary shrink-0">
          <span className="material-symbols-outlined">auto_awesome</span>
        </div>
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">Festify</h1>
            <p className="text-xs text-slate-500">College Event Hub</p>
          </div>
        )}
      </div>

      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 bg-surface-sidebar border border-slate-200 dark:border-white/10 text-slate-400 hover:text-text-primary rounded-full p-1 shadow-lg z-50 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        <Link to="/" className={`flex items-center gap-3 py-2.5 rounded-lg ${isActive('/')}`} title={isCollapsed ? "Explore Events" : ""}>
          <span className="material-symbols-outlined text-2xl">explore</span>
          {!isCollapsed && <span>Explore Events</span>}
        </Link>
        
        {currentUser && (
          <Link to="/dashboard" className={`flex items-center gap-3 py-2.5 rounded-lg ${isActive('/dashboard')}`} title={isCollapsed ? "Dashboard" : ""}>
            <span className="material-symbols-outlined text-2xl">dashboard</span>
             {!isCollapsed && <span>Dashboard</span>}
          </Link>
        )}

        {currentUser && userRole !== 'organizer' && (
          <Link to="/my-registrations" className={`flex items-center gap-3 py-2.5 rounded-lg ${isActive('/my-registrations')}`} title={isCollapsed ? "My Registrations" : ""}>
            <span className="material-symbols-outlined text-2xl">confirmation_number</span>
             {!isCollapsed && <span>My Registrations</span>}
          </Link>
        )}

        {currentUser && userRole !== 'organizer' && (
          <Link to="/saved-events" className={`flex items-center gap-3 py-2.5 rounded-lg ${isActive('/saved-events')}`} title={isCollapsed ? "Saved Events" : ""}>
            <span className="material-symbols-outlined text-2xl">bookmark</span>
             {!isCollapsed && <span>Saved Events</span>}
          </Link>
        )}

        {userRole === 'organizer' && (
             <>
                {!isCollapsed && (
                  <div className="pt-4 pb-2">
                      <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Organizer</p>
                  </div>
                )}
                {isCollapsed && <div className="h-4"></div>}
                
                <Link to="/create-fest" className={`flex items-center gap-3 py-2.5 rounded-lg ${isActive('/create-fest')}`} title={isCollapsed ? "Create Fest" : ""}>
                    <span className="material-symbols-outlined text-2xl">add_circle</span>
                     {!isCollapsed && <span>Create Fest</span>}
                </Link>

                <Link to="/manage-fests" className={`flex items-center gap-3 py-2.5 rounded-lg ${isActive('/manage-fests')}`} title={isCollapsed ? "Manage Fests" : ""}>
                    <span className="material-symbols-outlined text-2xl">edit_document</span>
                     {!isCollapsed && <span>Manage Fests</span>}
                </Link>
             </>
        )}

        {userRole === 'admin' && (
             <>
                {!isCollapsed && (
                <div className="pt-4 pb-2">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</p>
                </div>
                )}
                {isCollapsed && <div className="h-4"></div>}
                <Link to="/admin" className={`flex items-center gap-3 py-2.5 rounded-lg ${isActive('/admin')}`} title={isCollapsed ? "Admin Panel" : ""}>
                    <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                     {!isCollapsed && <span>Admin Panel</span>}
                </Link>
             </>
        )}

        {!isCollapsed && (
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</p>
          </div>
        )}
        {isCollapsed && <div className="h-4"></div>}
        
        {currentUser && (
          <Link to="/profile" className={`flex items-center gap-3 py-2.5 rounded-lg ${isActive('/profile')}`} title={isCollapsed ? "Profile" : ""}>
            <span className="material-symbols-outlined text-2xl">person</span>
             {!isCollapsed && <span>Profile</span>}
          </Link>
        )}
        
        <Link to="/settings" className={`flex items-center gap-3 py-2.5 rounded-lg ${isActive('/settings')}`} title={isCollapsed ? "Settings" : ""}>
          <span className="material-symbols-outlined text-2xl">settings</span>
           {!isCollapsed && <span>Settings</span>}
        </Link>

        {currentUser ? (
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-red-500 transition-colors ${isCollapsed ? 'justify-center px-2' : 'px-3'}`}
            title={isCollapsed ? "Logout" : ""}
          >
            <span className="material-symbols-outlined text-2xl">logout</span>
             {!isCollapsed && <span>Logout</span>}
          </button>
        ) : (
          <>
            <Link to="/login" className={`flex items-center gap-3 py-2.5 rounded-lg ${isActive('/login')}`} title={isCollapsed ? "Login" : ""}>
              <span className="material-symbols-outlined text-2xl">login</span>
              {!isCollapsed && <span>Login</span>}
            </Link>
            <Link to="/signup" className={`flex items-center gap-3 py-2.5 rounded-lg ${isActive('/signup')}`} title={isCollapsed ? "Sign Up" : ""}>
              <span className="material-symbols-outlined text-2xl">person_add</span>
              {!isCollapsed && <span>Sign Up</span>}
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-200 dark:border-white/5 space-y-4">
          <button
              onClick={toggleTheme}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300 transition-colors`}
              title={isCollapsed ? (theme === 'dark' ? "Light Mode" : "Dark Mode") : ""}
          >
              <span className="material-symbols-outlined text-2xl">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;

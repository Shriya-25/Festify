import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className="glass-card p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        {icon}
      </div>
      <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      <div className={`h-1 w-12 rounded-full ${color.replace('text-', 'bg-')}`}></div>
    </div>
  );

  const ActionCard = ({ title, description, link, icon, gradient }) => (
    <Link to={link} className="glass-card p-6 group hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-primary/20 transition-shadow`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </Link>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[10%] right-[10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{currentUser?.displayName || 'User'}</span>
            </h1>
            <p className="text-gray-400">
              {userRole === 'organizer' 
                ? 'Manage your fests and track registrations' 
                : 'Explore events and manage your bookings'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/profile" className="px-4 py-2 text-sm font-medium text-white glass-card hover:bg-white/5 transition-colors rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Link>
            <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-red-400 glass-card hover:bg-red-500/10 hover:border-red-500/30 transition-colors rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userRole === 'organizer' ? (
            <>
              <StatCard 
                title="Active Fests" 
                value="3" 
                color="text-primary"
                icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
              />
              <StatCard 
                title="Total Registrations" 
                value="1,245" 
                color="text-accent"
                icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              />
              <StatCard 
                title="Revenue" 
                value="₹45k" 
                color="text-green-400"
                icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
            </>
          ) : (
             <>
              <StatCard 
                title="My Events" 
                value="4" 
                color="text-primary"
                icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>}
              />
              <StatCard 
                title="Upcoming" 
                value="2" 
                color="text-accent"
                icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              />
              <StatCard 
                title="Certificates" 
                value="1" 
                color="text-blue-400"
                icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 pl-1 border-l-4 border-primary">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRole === 'organizer' ? (
              <>
                <ActionCard
                  title="Create New Fest"
                  description="Launch a new event page and start accepting registrations in minutes."
                  link="/create-fest"
                  gradient="from-primary to-orange-600"
                  icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                />
                <ActionCard
                  title="Manage Fests"
                  description="Edit details, view analytics, and manage attendees for your events."
                  link="/manage-fests"
                  gradient="from-blue-600 to-indigo-600"
                  icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                />
                <ActionCard
                  title="Organizer Profile"
                  description="Update your organization details and contact information."
                  link="/profile"
                  gradient="from-purple-600 to-pink-600"
                  icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                />
              </>
            ) : (
              <>
                <ActionCard
                  title="Browse Fests"
                  description="Discover upcoming college fests and exciting events near you."
                  link="/"
                  gradient="from-primary to-orange-600"
                  icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                />
                <ActionCard
                  title="My Tickets"
                  description="View your registered events and download entry passes."
                  link="/my-tickets"
                  gradient="from-blue-600 to-indigo-600"
                  icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>}
                />
                <ActionCard
                  title="Student Profile"
                  description="Update your personal details for faster registration."
                  link="/student-profile"
                  gradient="from-purple-600 to-pink-600"
                  icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                />
              </>
            )}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="glass-card p-6 md:p-8 mt-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Activity
          </h2>
          
          <div className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                <div>
                  <h4 className="text-white font-medium">Activity Log #{index + 1}</h4>
                  <p className="text-sm text-gray-500">You updated your profile details successfully.</p>
                </div>
                <span className="ml-auto text-xs text-gray-500">2 hours ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

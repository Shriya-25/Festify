import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Dashboard = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Hide global navbar for this page to use the new layout
    const nav = document.querySelector('nav');
    if (nav) nav.style.display = 'none';
    return () => {
      // Restore global navbar
      if (nav) nav.style.display = ''; 
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-surface-card backdrop-blur-xl border border-fest-border p-6 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 hover:shadow-glow-blue">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        {icon}
      </div>
      <h3 className="text-text-secondary text-sm font-bold uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-3xl font-bold text-text-primary mb-2">{value}</p>
      <div className={`h-1 w-12 rounded-full ${color.replace('text-', 'bg-')}`}></div>
    </div>
  );

  const ActionCard = ({ title, description, link, icon, gradient }) => (
    <Link to={link} className="bg-surface-card backdrop-blur-xl border border-fest-border p-6 rounded-2xl group hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 block h-full">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-primary/20 transition-shadow text-white`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-background font-display text-text-primary relative overflow-x-hidden before:fixed before:inset-0 before:bg-[radial-gradient(circle_at_20%_30%,rgba(58,190,255,0.1),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(0,136,255,0.08),transparent_40%)] before:-z-10">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col relative z-0">
        <Header />

        <div className="p-4 lg:p-8 space-y-8 flex-1">
            {/* Greeting Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-2 tracking-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-end">{currentUser?.displayName || 'User'}</span>
                </h1>
                <p className="text-text-secondary">
                {userRole === 'organizer' 
                    ? 'Manage your fests and track registrations' 
                    : 'Explore events and manage your bookings'}
                </p>
            </div>
            {/* Quick action buttons can be managed via Sidebar, kept logout for context if needed but sidebar has it too */}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRole === 'organizer' ? (
                <>
                <StatCard 
                    title="Active Fests" 
                    value="3" 
                    color="text-primary"
                    icon={<span className="material-symbols-outlined text-5xl">event</span>}
                />
                <StatCard 
                    title="Total Registrations" 
                    value="1,245" 
                    color="text-neon-pink"
                    icon={<span className="material-symbols-outlined text-5xl">group</span>}
                />
                <StatCard 
                    title="Revenue" 
                    value="₹45k" 
                    color="text-green-400"
                    icon={<span className="material-symbols-outlined text-5xl">payments</span>}
                />
                </>
            ) : (
                <>
                <StatCard 
                    title="My Events" 
                    value="4" 
                    color="text-primary"
                    icon={<span className="material-symbols-outlined text-5xl">confirmation_number</span>}
                />
                <StatCard 
                    title="Upcoming" 
                    value="2" 
                    color="text-royal-purple"
                    icon={<span className="material-symbols-outlined text-5xl">calendar_month</span>}
                />
                <StatCard 
                    title="Certificates" 
                    value="1" 
                    color="text-electric-blue"
                    icon={<span className="material-symbols-outlined text-5xl">workspace_premium</span>}
                />
                </>
            )}
            </div>

            {/* Quick Actions */}
            <div>
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userRole === 'organizer' ? (
                <>
                    <ActionCard
                    title="Create New Fest"
                    description="Launch a new event page and start accepting registrations in minutes."
                    link="/create-fest"
                    gradient="from-primary to-primary-end"
                    icon={<span className="material-symbols-outlined text-2xl">add_circle</span>}
                    />
                    <ActionCard
                    title="Manage Fests"
                    description="Edit details, view analytics, and manage attendees for your events."
                    link="/manage-fests"
                    gradient="from-royal-purple to-indigo-600"
                    icon={<span className="material-symbols-outlined text-2xl">edit_document</span>}
                    />
                    <ActionCard
                    title="Organizer Profile"
                    description="Update your organization details and contact information."
                    link="/profile"
                    gradient="from-neon-pink to-pink-600"
                    icon={<span className="material-symbols-outlined text-2xl">person_pin</span>}
                    />
                </>
                ) : (
                <>
                    <ActionCard
                    title="Browse Fests"
                    description="Discover upcoming college fests and exciting events near you."
                    link="/"
                    gradient="from-primary to-primary-end"
                    icon={<span className="material-symbols-outlined text-2xl">explore</span>}
                    />
                    <ActionCard
                    title="My Tickets"
                    description="View your registered events and download entry passes."
                    link="/my-tickets" // Assuming this route exists or maps to registered events
                    gradient="from-royal-purple to-indigo-600"
                    icon={<span className="material-symbols-outlined text-2xl">ticket</span>}
                    />
                    <ActionCard
                    title="Student Profile"
                    description="Update your personal details for faster registration."
                    link="/student-profile"
                    gradient="from-neon-pink to-pink-600"
                    icon={<span className="material-symbols-outlined text-2xl">person</span>}
                    />
                </>
                )}
            </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-surface-card backdrop-blur-xl border border-fest-border p-6 md:p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Recent Activity
            </h2>
            
            <div className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-fest-border hover:bg-surface-card transition-colors">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <div>
                    <h4 className="text-text-primary font-medium text-sm">Activity Log #{index + 1}</h4>
                    <p className="text-xs text-text-secondary">You updated your profile details successfully.</p>
                    </div>
                    <span className="ml-auto text-xs text-text-secondary">2h ago</span>
                </div>
                ))}
            </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

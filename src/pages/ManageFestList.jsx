import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const ManageFestList = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [fests, setFests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Hide global navbar for this page
    const nav = document.querySelector('nav');
    if (nav) nav.style.display = 'none';

    if (userRole !== 'organizer') {
        navigate('/dashboard');
        return;
    }

    fetchOrganizerFests();

    return () => {
      if (nav) nav.style.display = ''; 
    };
  }, [currentUser, userRole, navigate]);

  const fetchOrganizerFests = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'fests'),
        where('createdBy', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const festsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by status and date
      festsData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      
      setFests(festsData);
    } catch (error) {
      console.error('Error fetching fests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-display text-text-primary relative overflow-x-hidden before:fixed before:inset-0 before:bg-[radial-gradient(circle_at_20%_30%,rgba(58,190,255,0.1),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(0,136,255,0.08),transparent_40%)] before:-z-10">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      <main className={`flex-1 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} min-h-screen flex flex-col relative z-0 transition-all duration-300`}>
        <Header />

        <div className="p-4 lg:p-8 space-y-8 flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-text-primary mb-2 tracking-tight">Manage Fests</h1>
              <p className="text-text-secondary">You have {fests.length} active festivals currently being organized.</p>
            </div>
            
            <Link 
              to="/create-fest" 
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg shadow-glow-primary transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Create New Fest
            </Link>
          </div>

          {loading ? (
             <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : fests.length === 0 ? (
            <div className="bg-surface-card border border-fest-border rounded-2xl p-12 text-center">
                <div className="w-20 h-20 bg-surface border border-fest-border rounded-full flex items-center justify-center mx-auto mb-6 text-text-muted">
                    <span className="material-symbols-outlined text-4xl">event_busy</span>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">No Fests Created Yet</h3>
                <p className="text-text-secondary mb-6 max-w-md mx-auto">Start by creating your first fest to manage events and registrations.</p>
                <Link 
                  to="/create-fest" 
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors inline-flex items-center gap-2"
                >
                  Create Fest
                </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fests.map(fest => (
                <div key={fest.id} className="group bg-surface-card border border-fest-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg flex flex-col h-full">
                    
                    {/* Banner Image Area */}
                    <div className="h-40 bg-surface relative overflow-hidden">
                        {fest.bannerUrl ? (
                            <img 
                                src={fest.bannerUrl} 
                                alt={fest.festName} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-primary/40">image</span>
                            </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                                fest.status === 'approved' ? 'bg-primary text-white' :
                                fest.status === 'published' ? 'bg-green-500 text-white' :
                                fest.status === 'pending' ? 'bg-amber-500 text-white' :
                                'bg-slate-500 text-white'
                            }`}>
                                {fest.status || 'Draft'}
                            </span>
                        </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-text-primary mb-1 line-clamp-1">{fest.festName}</h3>
                            <p className="text-primary text-xs font-semibold uppercase tracking-wide line-clamp-1">
                                {fest.collegeName} {fest.tagline && `• ${fest.tagline}`}
                            </p>
                        </div>
                        
                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-text-secondary text-sm">
                                <span className="material-symbols-outlined text-lg opacity-70">calendar_month</span>
                                <span>
                                    {new Date(fest.festStartDate || fest.startDate || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - {new Date(fest.festEndDate || fest.endDate || fest.festStartDate || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-text-secondary text-sm">
                                <span className="material-symbols-outlined text-lg opacity-70">location_on</span>
                                <span className="truncate">{fest.city || fest.venue || 'TBA'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-auto">
                            <Link 
                                to={`/fest/${fest.id}/manage`}
                                className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-fest-border text-text-primary font-semibold text-sm hover:bg-white/5 transition-colors"
                            >
                                Manage
                            </Link>
                            <Link 
                                to={`/fest/${fest.id}/create-event`}
                                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-colors"
                            >
                                Add Event
                            </Link>
                        </div>
                    </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Activity Section */}
          <div className="mt-12 bg-surface-card border border-fest-border rounded-2xl p-6">
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Recent Activity
            </h2>
            
            <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-fest-border hover:bg-surface-card transition-colors">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                    <div>
                    <h4 className="text-text-primary font-medium text-sm">Login Successful</h4>
                    <p className="text-xs text-text-secondary">Welcome back to your dashboard.</p>
                    </div>
                    <span className="ml-auto text-xs text-text-secondary">Just now</span>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-fest-border hover:bg-surface-card transition-colors">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                    <div>
                    <h4 className="text-text-primary font-medium text-sm">Fest Updated</h4>
                    <p className="text-xs text-text-secondary">Updated details for "TechStorm 2024"</p>
                    </div>
                    <span className="ml-auto text-xs text-text-secondary">2 hours ago</span>
                </div>

                 <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-fest-border hover:bg-surface-card transition-colors">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></div>
                    <div>
                    <h4 className="text-text-primary font-medium text-sm">New Event Added</h4>
                    <p className="text-xs text-text-secondary">Added "Hackathon" to TechStorm 2024</p>
                    </div>
                    <span className="ml-auto text-xs text-text-secondary">5 hours ago</span>
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManageFestList;

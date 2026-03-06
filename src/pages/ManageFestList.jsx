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
              <p className="text-text-secondary">Select a fest to manage events, registrations, and details.</p>
            </div>
            
            <Link 
              to="/create-fest" 
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-end text-bg-base font-bold rounded-xl shadow-glow-primary hover:scale-105 transition-transform flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Create New Fest
            </Link>
          </div>

          {loading ? (
             <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : fests.length === 0 ? (
            <div className="bg-surface-card border border-white/10 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 bg-surface border border-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
                    <span className="material-symbols-outlined text-4xl">event_busy</span>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">No Fests Created Yet</h3>
                <p className="text-text-secondary mb-6 max-w-md mx-auto">Start by creating your first fest to manage events and registrations.</p>
                <Link 
                  to="/create-fest" 
                  className="px-6 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-colors inline-flex items-center gap-2"
                >
                  Create Fest
                </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {fests.map(fest => (
                <div key={fest.id} className="bg-surface-card backdrop-blur-xl border border-fest-border p-6 rounded-2xl group hover:border-primary/50 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                fest.status === 'published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                fest.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                                {fest.status}
                            </span>
                            <h3 className="text-xl font-bold text-text-primary mt-3 group-hover:text-primary transition-colors">{fest.festName}</h3>
                            <p className="text-text-secondary text-sm">{fest.collegeName}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-surface border border-white/5 flex items-center justify-center text-text-muted">
                             <span className="material-symbols-outlined">event</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-text-secondary mb-6">
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-lg">calendar_month</span>
                            {new Date(fest.festStartDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-lg">location_on</span>
                            {fest.city}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Link 
                            to={`/fest/${fest.id}/manage`}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface hover:bg-white/5 border border-white/10 text-text-primary font-semibold transition-colors group/btn"
                        >
                            <span className="material-symbols-outlined text-primary group-hover/btn:scale-110 transition-transform">settings</span>
                            Manage
                        </Link>
                        <Link 
                            to={`/fest/${fest.id}/create-event`}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20 text-primary font-semibold transition-colors"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Add Event
                        </Link>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageFestList;

import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import FestCard from '../components/FestCard';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [fests, setFests] = useState([]);
  const [filteredFests, setFilteredFests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Only 3 categories: Technical, Cultural, Sports
  const categories = ['all', 'Technical', 'Cultural', 'Sports'];

  const scrollLeft = () => {
    if (scrollRef.current) {
        scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
      if (scrollRef.current) {
          scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
      }
  };

  
  // Date filter options
  const dateFilters = [
    { value: 'all', label: 'All Dates' },
    { value: 'within2days', label: 'Within 2 Days' },
    { value: 'thisweek', label: 'This Week' },
    { value: 'nextweek', label: 'Next Week' },
    { value: 'nextmonth', label: 'Next Month' }
  ];
  
  // Predefined metro cities
  const metroCities = ['Pune', 'Mumbai', 'Hyderabad', 'Bangalore', 'Delhi'];

  useEffect(() => {
    // Hide global navbar for this page to use the new layout
    const nav = document.querySelector('nav');
    if (nav) nav.style.display = 'none';

    // Check if user is logged in but email not verified (email/password users only)
    if (currentUser && !currentUser.emailVerified && currentUser.providerData[0]?.providerId === 'password') {
      navigate('/verify-email');
      return;
    }
    fetchFests();

    // Show Auth Modal if not logged in (Session based to avoid annoyance)
    if (!currentUser) {
        const hasSeenModal = sessionStorage.getItem('seenAuthModal');
        if (!hasSeenModal) {
             setShowAuthModal(true);
             sessionStorage.setItem('seenAuthModal', 'true');
        }
    }

    return () => {
      // Restore global navbar when leaving home
      if (nav) nav.style.display = ''; 
    };
  }, [currentUser, navigate]);

  useEffect(() => {
    filterFests();
  }, [searchTerm, selectedCategory, cityFilter, dateFilter, fests]);

  const fetchFests = async () => {
    try {
      setLoading(true);
      const festsQuery = query(
        collection(db, 'fests'),
        where('status', 'in', ['published', 'approved'])
      );
      
      const querySnapshot = await getDocs(festsQuery);
      const festsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by fest start date
      festsData.sort((a, b) => new Date(a.festStartDate) - new Date(b.festStartDate));
      
      setFests(festsData);
      setFilteredFests(festsData);
    } catch (error) {
      console.error('Error fetching fests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if date matches filter (isDateInRange reused)
  const isDateInRange = (festDate, filterType) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fest = new Date(festDate);
    fest.setHours(0, 0, 0, 0);
    
    switch (filterType) {
      case 'within2days': {
        const twoDaysLater = new Date(today);
        twoDaysLater.setDate(today.getDate() + 2);
        return fest >= today && fest <= twoDaysLater;
      }
      case 'thisweek': {
        const dayOfWeek = today.getDay();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - dayOfWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return fest >= weekStart && fest <= weekEnd;
      }
      case 'nextweek': {
        const dayOfWeek = today.getDay();
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() + (7 - dayOfWeek));
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
        return fest >= nextWeekStart && fest <= nextWeekEnd;
      }
      case 'nextmonth': {
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        return fest >= nextMonthStart && fest <= nextMonthEnd;
      }
      default:
        return true;
    }
  };

  const filterFests = () => {
    let filtered = fests;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(fest => fest.category === selectedCategory);
    }

    // Filter by city
    if (cityFilter !== 'all') {
      filtered = filtered.filter(fest => fest.city === cityFilter);
    }

    // Filter by date range
    if (dateFilter !== 'all' && dateFilter) {
      filtered = filtered.filter(fest => fest.festStartDate && isDateInRange(fest.festStartDate, dateFilter));
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(fest =>
        fest.festName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fest.collegeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fest.venue || fest.location || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFests(filtered);
  };

  return (
    <div className="flex min-h-screen bg-bg-base font-display text-text-primary relative overflow-x-hidden before:fixed before:inset-0 before:bg-[radial-gradient(circle_at_20%_30%,rgba(58,190,255,0.1),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(0,136,255,0.08),transparent_40%)] before:-z-10">
      
      {/* Auth Modal Popup */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface-card border border-white/10 p-6 rounded-2xl max-w-sm w-full relative shadow-2xl shadow-black/50 overflow-hidden group">
                {/* Decorative gradients */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-neon-pink/20 rounded-full blur-3xl group-hover:bg-neon-pink/30 transition-colors"></div>

                <button 
                    onClick={() => setShowAuthModal(false)} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1 rounded-full z-10"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
                
                <div className="text-center space-y-4 relative z-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-royal-purple/20 border border-white/10 rounded-full flex items-center justify-center mx-auto text-primary shadow-glow-primary">
                        <span className="material-symbols-outlined text-2xl">lock</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Unlock Festify</h3>
                        <p className="text-sm text-gray-400 mt-1">Sign in to register for events, save favorites, and manage your profile.</p>
                    </div>
                    <div className="flex flex-col gap-3 pt-2">
                        <Link to="/login" className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-end text-bg-base rounded-xl font-bold hover:shadow-glow-primary transition-all scale-100 hover:scale-[1.02]">
                            Login
                        </Link>
                        <Link to="/signup" className="w-full py-2.5 bg-white/5 text-white border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all hover:border-white/20">
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      {/* Main Content */}
      <main className={`flex-1 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} min-h-screen flex flex-col relative z-0 transition-all duration-300`}>
        <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <div className="p-4 lg:p-8 space-y-8 flex-1">
            {/* Hero Section */}
            <section className="relative rounded-3xl overflow-hidden min-h-[250px] flex flex-col justify-end p-6 lg:p-10 group shadow-2xl shadow-black/40">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                     style={{
                        backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1459749411177-8c4750bb0e8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')"
                     }}>
                </div>
                <div className="relative z-10 space-y-2 max-w-3xl">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md text-primary text-xs font-bold tracking-wider uppercase">
                        Featured Event
                    </div>
                    <div className="pb-1">
                        <h1 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
                            {currentUser ? `Welcome back, ${currentUser.displayName?.split(' ')[0] || 'User'}!` : 'Welcome to Festify!'}
                        </h1>
                        <p className="text-slate-200 mt-1 text-base lg:text-lg max-w-2xl drop-shadow-md">
                            Spring Bloom 2024 is almost here. Experience the biggest cultural fest of the year!
                        </p>
                    </div>
                </div>
            </section>

            {/* Categories & Filters */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <span className="w-1 h-6 bg-neon-pink rounded-full"></span>
                        Browse Categories
                    </h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x p-1">
                    <button 
                         onClick={() => setSelectedCategory('all')}
                         className={`px-6 py-3 snap-start rounded-full font-bold whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-gradient-to-r from-primary to-primary-end text-white shadow-glow-primary scale-105' : 'bg-surface-card border border-slate-200 dark:border-white/10 text-text-secondary hover:border-primary/50 hover:text-primary dark:hover:text-white'}`}
                    >
                        All Events
                    </button>
                    {categories.filter(c => c !== 'all').map(category => (
                         <button 
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-6 py-3 snap-start rounded-full font-bold whitespace-nowrap transition-all ${selectedCategory === category ? 'bg-gradient-to-r from-royal-purple to-purple-600 text-white shadow-lg scale-105' : 'bg-surface-card border border-slate-200 dark:border-white/10 text-text-secondary hover:border-royal-purple/50 hover:text-primary dark:hover:text-white'}`}
                         >
                            {category}
                         </button>
                    ))}
                    
                    {/* Custom Styled Dropdowns */}
                    <div className="relative group snap-start min-w-[140px]">
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-text-secondary group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-sm">expand_more</span>
                        </div>
                        <select 
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            className="w-full appearance-none pl-5 pr-10 py-3 rounded-full bg-surface-card border border-slate-200 dark:border-white/10 text-text-secondary font-bold text-sm whitespace-nowrap hover:border-electric-blue hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-electric-blue/50"
                        >
                            <option value="all">City: All</option>
                            {metroCities.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                    </div>

                    <div className="relative group snap-start min-w-[150px]">
                         <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-text-secondary group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-sm">expand_more</span>
                        </div>
                        <select 
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full appearance-none pl-5 pr-10 py-3 rounded-full bg-surface-card border border-slate-200 dark:border-white/10 text-text-secondary font-bold text-sm whitespace-nowrap hover:border-electric-blue hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-electric-blue/50"
                        >
                            <option value="all">Date: All</option>
                            {dateFilters.filter(f => f.value !== 'all').map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                    </div>
                </div>
            </section>

            {/* Live Events (Horizontal Carousel) */}
            <section className="space-y-6 group/slider">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.7)]"></span>
                        <h2 className="text-2xl font-bold text-white tracking-wide drop-shadow-lg">Live Events</h2>
                     </div>
                     <div className="flex items-center gap-4 self-start md:self-auto opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300">
                        {/* Navigation Buttons */}
                        <div className="hidden md:flex gap-2">
                            <button onClick={scrollLeft} className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-colors">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button onClick={scrollRight} className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-colors">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                     </div>
                </div>
                
                {/* Horizontal Scroll Layout - Netflix Style */}
                <div className="relative group/carousel">
                    {/* Navigation Buttons Overlay (Large Side Buttons) */}
                     <button 
                        onClick={scrollLeft}
                        className="absolute left-0 top-0 bottom-8 z-30 w-12 bg-gradient-to-r from-black/80 to-transparent text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:from-black/90 focus:outline-none"
                        aria-label="Scroll Left"
                     >
                        <span className="material-symbols-outlined text-4xl drop-shadow-lg transform hover:scale-125 transition-transform">chevron_left</span>
                     </button>
                     <button 
                        onClick={scrollRight}
                        className="absolute right-0 top-0 bottom-8 z-30 w-12 bg-gradient-to-l from-black/80 to-transparent text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:from-black/90 focus:outline-none"
                        aria-label="Scroll Right"
                     >
                        <span className="material-symbols-outlined text-4xl drop-shadow-lg transform hover:scale-125 transition-transform">chevron_right</span>
                     </button>

                    {loading ? (
                        <div className="flex overflow-x-hidden gap-4 pb-8 px-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="min-w-[280px] h-72 rounded-xl bg-white/5 animate-pulse border border-white/5"></div>
                            ))}
                        </div>
                    ) : filteredFests.length > 0 ? (
                        <div 
                            ref={scrollRef}
                            className="flex overflow-x-auto gap-4 pb-8 pt-4 px-1 snap-x snap-mandatory scrollbar-hide items-stretch" 
                            style={{ scrollBehavior: 'smooth' }}
                        >
                            {filteredFests.map(fest => (
                                <div key={fest.id} className="min-w-[280px] max-w-[280px] md:min-w-[300px] md:max-w-[300px] snap-center transform transition-all duration-300 hover:scale-105 hover:z-20 origin-center cursor-pointer">
                                    <FestCard fest={fest} />
                                </div>
                            ))}
                            
                            {/* Spacer for right padding */}
                            <div className="min-w-[20px] snap-start"></div>
                        </div>
                    ) : (
                        <div className="bg-surface-card p-12 rounded-xl border border-white/10 text-center backdrop-blur-md">
                            <div className="text-4xl mb-4">🔍</div>
                            <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
                            <p className="text-text-secondary">Try adjusting your filters or search term.</p>
                            <button 
                                onClick={() => {setSearchTerm(''); setSelectedCategory('all'); setCityFilter('all');}}
                                className="mt-6 px-6 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-white transition-colors"
                            >
                                Reset Filters
                            </button>
                        </div>
                    )}
                </div>
            </section>

             {/* Upcoming Events Section */}
             <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                         <span className="w-1 h-6 bg-royal-purple rounded-full"></span>
                         Upcoming Events
                    </h2>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x px-2">
                    {loading ? (
                         <div className="min-w-[280px] h-64 bg-white/5 animate-pulse rounded-xl"></div>
                    ) : (
                         fests.filter(f => new Date(f.festStartDate) > new Date()).slice(0, 5).map(fest => (
                              <div key={`upcoming-${fest.id}`} className="min-w-[280px] snap-start">
                                 <FestCard fest={fest} />
                              </div>
                         ))
                    )}
                </div>
            </section>
        </div>
      </main>
    </div>
  );
};

export default Home;


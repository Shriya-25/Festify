import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import FestCard from '../components/FestCard';
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
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Only 3 categories: Technical, Cultural, Sports
  const categories = ['all', 'Technical', 'Cultural', 'Sports'];
  
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
    // Check if user is logged in but email not verified (email/password users only)
    if (currentUser && !currentUser.emailVerified && currentUser.providerData[0]?.providerId === 'password') {
      navigate('/verify-email');
      return;
    }
    fetchFests();
  }, [currentUser]);

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
      
      console.log('Fetched published fests:', festsData);
      setFests(festsData);
      setFilteredFests(festsData);
    } catch (error) {
      console.error('Error fetching fests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get fest status
  const getFestStatus = (fest) => {
    if (!fest.registrationStartDate || !fest.registrationEndDate) {
      return 'unknown';
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const regStart = new Date(fest.registrationStartDate);
    regStart.setHours(0, 0, 0, 0);
    const regEnd = new Date(fest.registrationEndDate);
    regEnd.setHours(0, 0, 0, 0);
    
    if (today < regStart) {
      return 'upcoming'; // Registration hasn't started yet
    } else if (today >= regStart && today <= regEnd) {
      return 'live'; // Registration is open
    } else {
      return 'closed'; // Registration closed
    }
  };

  // Helper function to check if date matches filter
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-float"></div>
         <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent-purple/10 rounded-full blur-[120px] animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Hero Section */}
      <div className="relative pt-[140px] pb-12 sm:pb-24 px-6 z-10">
        <div className="container-max text-center max-w-4xl mx-auto">
           {/* Animated Badge */}
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-sm font-medium text-gray-300">Live Updates Enabled</span>
           </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in" style={{animationDelay: '0.1s'}}>
            Experience the Best <br />
            <span className="text-gradient">College Fests</span>
          </h1>
          
          <p className="text-lg md:text-xl text-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{animationDelay: '0.2s'}}>
            The ultimate platform to discover, register, and participate in college events across the country. One account, endless possibilities.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative mb-12 animate-fade-in" style={{animationDelay: '0.3s'}}>
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="search-rounded w-full pl-14 pr-6 h-16 text-lg shadow-glass focus:shadow-glow transition-all duration-300 bg-surface/80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in" style={{animationDelay: '0.4s'}}>
            <div className="glass-panel p-1.5 flex flex-wrap gap-1 rounded-full justify-center bg-surface/50 backdrop-blur-md">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>
            
             <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-6 py-3 rounded-full bg-surface/50 border border-white/10 text-gray-300 focus:outline-none focus:border-primary/50 text-sm backdrop-blur-md hover:bg-surface/80 transition-colors cursor-pointer"
             >
                <option value="all">All Cities</option>
                {metroCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
             </select>

             <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-6 py-3 rounded-full bg-surface/50 border border-white/10 text-gray-300 focus:outline-none focus:border-primary/50 text-sm backdrop-blur-md hover:bg-surface/80 transition-colors cursor-pointer"
             >
               {dateFilters.map(filter => (
                 <option key={filter.value} value={filter.value}>{filter.label}</option>
               ))}
             </select>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container-max section-padding min-h-[500px] relative z-10">
         <div className="flex flex-col sm:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Upcoming Fests</h2>
              <p className="text-text-secondary">Don't miss out on these amazing events</p>
            </div>
            <div className="hidden sm:block text-sm text-gray-500 bg-white/5 px-4 py-2 rounded-full border border-white/5">
               Showing {filteredFests.length} results
            </div>
         </div>

         {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
               {[1,2,3,4].map(n => (
                 <div key={n} className="h-[400px] rounded-2xl bg-white/5 animate-pulse border border-white/5"></div>
               ))}
            </div>
         ) : filteredFests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredFests.map((fest) => (
                <FestCard key={fest.id} fest={fest} />
              ))}
            </div>
         ) : (
            <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10 border-dashed backdrop-blur-sm">
               <div className="text-6xl mb-6 opacity-50">🔍</div>
               <h3 className="text-xl font-bold text-white mb-2">No fests found</h3>
               <p className="text-gray-400 mb-8 max-w-md mx-auto">We couldn't find any fests matching your current filters. Try adjusting your search criteria.</p>
               <button 
                onClick={() => {setSearchTerm(''); setSelectedCategory('all'); setCityFilter('all'); setDateFilter('all');}}
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
               >
                 Clear all filters
               </button>
            </div>
         )}
      </div>
    </div>
  );
};

export default Home;

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
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Only 3 categories: Technical, Cultural, Sports
  const categories = ['all', 'Technical', 'Cultural', 'Sports'];

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
  }, [searchTerm, selectedCategory, fests]);

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
      
      // Sort by date on client side
      festsData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      console.log('Fetched published fests:', festsData);
      setFests(festsData);
      setFilteredFests(festsData);
    } catch (error) {
      console.error('Error fetching fests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFests = () => {
    let filtered = fests;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(fest => fest.category === selectedCategory);
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative py-8 sm:py-16 lg:py-24 overflow-hidden">
        {/* Gradient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-transparent opacity-50 blur-3xl"></div>
        
        <div className="relative max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 tracking-tight">
            Discover College Fests Near You
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-10 max-w-2xl mx-auto px-2">
            Explore, Register, and Experience Amazing College Events
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-6 sm:mb-8 px-2">
            <div className="relative">
              <svg className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by fest name, college, or location..."
                className="search-rounded w-full pl-12 sm:pl-14 pr-4 py-3 sm:py-4 text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="max-w-2xl mx-auto px-2">
            <div className="glass-container p-2 flex flex-wrap items-center justify-center gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 sm:px-6 py-2 rounded-full font-medium text-sm sm:text-base transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-primary text-white shadow-glow'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {category === 'all' ? 'All Categories' : category}
                </button>
              ))}
            </div>
          </div>

          {!currentUser && (
            <div className="mt-6 sm:mt-10 px-2">
              <Link to="/signup" className="btn-primary text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 inline-block">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Fests Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 lg:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-2">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            {selectedCategory === 'all' ? 'All Fests' : `${selectedCategory} Fests`}
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <p className="text-sm sm:text-base text-gray-400">
              {filteredFests.length} {filteredFests.length === 1 ? 'fest' : 'fests'} found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 sm:py-20">
            <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-gray-600 border-t-primary"></div>
            <p className="text-gray-400 mt-4 text-sm sm:text-base">Loading fests...</p>
          </div>
        ) : filteredFests.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <div className="glass-container p-6 sm:p-12 max-w-md mx-auto">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400 text-base sm:text-lg mb-2">No fests found</p>
              <p className="text-gray-500 text-xs sm:text-sm">Try adjusting your search or filters</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filteredFests.map(fest => (
              <FestCard key={fest.id} fest={fest} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import FestCard from '../components/FestCard';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [fests, setFests] = useState([]);
  const [filteredFests, setFilteredFests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { currentUser } = useAuth();

  const categories = ['all', 'Cultural', 'Technical', 'Sports', 'Literary', 'Music', 'Dance', 'Other'];

  useEffect(() => {
    fetchFests();
  }, []);

  useEffect(() => {
    filterFests();
  }, [searchTerm, selectedCategory, fests]);

  const fetchFests = async () => {
    try {
      setLoading(true);
      const festsQuery = query(
        collection(db, 'fests'),
        where('status', '==', 'approved'),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(festsQuery);
      const festsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
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
        fest.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFests(filtered);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Discover College Fests Near You
          </h1>
          <p className="text-xl mb-8">
            Explore, Register, and Experience Amazing College Events
          </p>
          {!currentUser && (
            <Link to="/signup" className="bg-white text-primary font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition duration-200">
              Get Started
            </Link>
          )}
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search by fest name, college, or location..."
                className="input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                className="input-field"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Fests Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            {selectedCategory === 'all' ? 'All Fests' : `${selectedCategory} Fests`}
          </h2>
          <p className="text-gray-600">
            {filteredFests.length} {filteredFests.length === 1 ? 'fest' : 'fests'} found
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading fests...</p>
          </div>
        ) : filteredFests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No fests found</p>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFests.map(fest => (
              <FestCard key={fest.id} fest={fest} />
            ))}
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="bg-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.filter(c => c !== 'all').map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`p-6 rounded-lg text-center transition duration-200 ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <p className="font-semibold">{category}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const FestDetails = () => {
  const { id } = useParams();
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [fest, setFest] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('All');

  useEffect(() => {
    fetchFestAndEvents();
  }, [id]);

  const fetchFestAndEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch fest details
      const festDoc = await getDoc(doc(db, 'fests', id));
      if (festDoc.exists()) {
        setFest({ id: festDoc.id, ...festDoc.data() });
      } else {
        console.error('Fest not found');
        navigate('/');
        return;
      }

      // Fetch events for this fest
      const eventsQuery = query(
        collection(db, 'events'),
        where('festId', '==', id)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      let eventsData = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter events based on user role
      // Students: only see approved events
      // Organizers who own the fest: see all events
      // Other users: only see approved events
      if (userRole !== 'organizer' || festDoc.data().createdBy !== currentUser?.uid) {
        eventsData = eventsData.filter(event => event.status === 'approved');
      }

      // Sort by date
      eventsData.sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(eventsData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isRegistrationOpen = (event) => {
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);
    return now < deadline;
  };

  const domains = ['All', ...new Set(events.map(e => e.domain))];
  
  const filteredEvents = selectedDomain === 'All' 
    ? events 
    : events.filter(e => e.domain === selectedDomain);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Loading fest details...</p>
        </div>
      </div>
    );
  }

  if (!fest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Fest Not Found</h2>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Banner Image */}
        {fest.bannerUrl && (
          <div className="mb-4 sm:mb-6 md:mb-8">
            <img
              src={fest.bannerUrl}
              alt={fest.festName}
              className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Fest Details */}
        <div className="glass-container p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">{fest.festName}</h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-300">{fest.collegeName}</p>
            </div>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-white rounded-full text-xs sm:text-sm font-semibold self-start">
              {fest.category}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center text-gray-300 text-sm sm:text-base">
              <span className="font-semibold mr-2">Venue:</span>
              <span>{fest.venue || fest.location || 'TBA'}</span>
            </div>
            <div className="flex items-center text-gray-300 text-sm sm:text-base">
              <span className="font-semibold mr-2">Date:</span>
              <span>{new Date(fest.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-gray-300 text-sm sm:text-base">
              <span className="font-semibold mr-2">Events:</span>
              <span>{events.length}</span>
            </div>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">About</h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              {fest.description}
            </p>
          </div>
        </div>

        {/* Events Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Events</h2>
            
            {/* Domain Filter */}
            {events.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {domains.map(domain => (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(domain)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
                      selectedDomain === domain
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="glass-container p-8 sm:p-12 text-center">
              <p className="text-sm sm:text-base text-gray-400 mb-4">
                {events.length === 0 
                  ? 'No events have been added yet. Check back soon!' 
                  : 'No events in this category'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredEvents.map(event => (
                <div key={event.id} className="glass-container overflow-hidden hover:shadow-xl transition">
                  {/* Event Banner */}
                  {event.bannerUrl && (
                    <div className="w-full h-40 sm:h-48 overflow-hidden bg-white/5">
                      <img 
                        src={event.bannerUrl} 
                        alt={event.eventName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">
                        {event.eventName}
                      </h3>
                      {isRegistrationOpen(event) ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded font-semibold whitespace-nowrap border border-green-500/30 flex-shrink-0">
                          Open
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded font-semibold whitespace-nowrap border border-red-500/30 flex-shrink-0">
                          Closed
                        </span>
                      )}
                    </div>

                    <div className="mb-2 sm:mb-3">
                      <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-500/20 text-blue-400 text-xs sm:text-sm rounded-full font-semibold border border-blue-500/30">
                        {event.domain}
                      </span>
                    </div>

                    <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">
                      {event.description}
                    </p>

                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
                      <div className="flex items-center">
                        <span className="font-semibold mr-2"></span>
                        {new Date(event.date).toLocaleDateString()} at {event.time}
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold mr-2"></span>
                        {event.venue}
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold mr-2"></span>
                        {event.participantCount || 0} registered
                        {event.maxParticipants && ` / ${event.maxParticipants}`}
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold mr-2"></span>
                        Deadline: {new Date(event.registrationDeadline).toLocaleString()}
                      </div>
                    </div>

                    <Link
                      to={`/event/${event.id}`}
                      className="btn-primary w-full text-center block text-sm sm:text-base py-2 sm:py-3"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 sm:mt-8">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
          >
            ← Back to All Fests
          </button>
        </div>
      </div>
    </div>
  );
};

export default FestDetails;

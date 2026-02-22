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
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!fest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Fest Not Found</h2>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Image */}
        {fest.bannerUrl && (
          <div className="mb-8">
            <img
              src={fest.bannerUrl}
              alt={fest.festName}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Fest Details */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{fest.festName}</h1>
              <p className="text-xl text-gray-600">{fest.collegeName}</p>
            </div>
            <span className="px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold">
              {fest.category}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center text-gray-700">
              <span className="font-semibold mr-2">📍 Venue:</span>
              <span>{fest.venue || fest.location || 'TBA'}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <span className="font-semibold mr-2">📅 Date:</span>
              <span>{new Date(fest.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <span className="font-semibold mr-2">🎯 Events:</span>
              <span>{events.length}</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">About</h2>
            <p className="text-gray-700 leading-relaxed">
              {fest.description}
            </p>
          </div>
        </div>

        {/* Events Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Events</h2>
            
            {/* Domain Filter */}
            {events.length > 0 && (
              <div className="flex gap-2">
                {domains.map(domain => (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(domain)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      selectedDomain === domain
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 mb-4">
                {events.length === 0 
                  ? 'No events have been added yet. Check back soon!' 
                  : 'No events in this category'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => (
                <div key={event.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                  {/* Event Banner */}
                  {event.bannerUrl && (
                    <div className="w-full h-48 overflow-hidden bg-gray-200">
                      <img 
                        src={event.bannerUrl} 
                        alt={event.eventName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gray-800 pr-2">
                        {event.eventName}
                      </h3>
                      {isRegistrationOpen(event) ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-semibold whitespace-nowrap">
                          Open
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-semibold whitespace-nowrap">
                          Closed
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-primary text-sm rounded-full font-semibold">
                        {event.domain}
                      </span>
                    </div>

                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                      {event.description}
                    </p>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <span className="font-semibold mr-2">📅</span>
                        {new Date(event.date).toLocaleDateString()} at {event.time}
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold mr-2">📍</span>
                        {event.venue}
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold mr-2">👥</span>
                        {event.participantCount || 0} registered
                        {event.maxParticipants && ` / ${event.maxParticipants}`}
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold mr-2">⏰</span>
                        Deadline: {new Date(event.registrationDeadline).toLocaleString()}
                      </div>
                    </div>

                    <Link
                      to={`/event/${event.id}`}
                      className="btn-primary w-full text-center block"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            ← Back to All Fests
          </button>
        </div>
      </div>
    </div>
  );
};

export default FestDetails;

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
              <span className="font-semibold mr-2">City:</span>
              <span>{fest.city || 'TBA'}</span>
            </div>
            <div className="flex items-center text-gray-300 text-sm sm:text-base">
              <span className="font-semibold mr-2">Venue:</span>
              <span>{fest.venue || 'TBA'}</span>
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

          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">About</h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              {fest.description}
            </p>
          </div>

          {/* Social Media Links */}
          {fest.socialMedia && Object.values(fest.socialMedia).some(val => val) && (
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4">Connect With Us</h2>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {fest.socialMedia.instagram && (
                  <a
                    href={fest.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/50 rounded-lg transition-colors text-pink-400"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span className="text-sm">Instagram</span>
                  </a>
                )}
                {fest.socialMedia.linkedin && (
                  <a
                    href={fest.socialMedia.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg transition-colors text-blue-400"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    <span className="text-sm">LinkedIn</span>
                  </a>
                )}
                {fest.socialMedia.website && (
                  <a
                    href={fest.socialMedia.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg transition-colors text-green-400"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                    </svg>
                    <span className="text-sm">Website</span>
                  </a>
                )}
                {fest.socialMedia.youtube && (
                  <a
                    href={fest.socialMedia.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-colors text-red-400"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                    <span className="text-sm">YouTube</span>
                  </a>
                )}
                {fest.socialMedia.twitter && (
                  <a
                    href={fest.socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/50 rounded-lg transition-colors text-gray-400"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span className="text-sm">Twitter/X</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Sponsors */}
          {fest.sponsors && fest.sponsors.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4">Sponsors</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {fest.sponsors.map(sponsor => (
                  <div key={sponsor.id} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <img 
                      src={sponsor.logoUrl} 
                      alt={sponsor.name}
                      className="h-16 w-full object-contain mb-2"
                    />
                    <p className="text-white text-xs text-center truncate">{sponsor.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery */}
          {fest.gallery && fest.gallery.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4">Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {fest.gallery.map(image => (
                  <div key={image.id} className="relative group">
                    <img 
                      src={image.url} 
                      alt="Gallery"
                      className="w-full h-32 sm:h-40 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(image.url, '_blank')}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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

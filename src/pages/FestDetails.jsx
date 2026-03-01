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

      // Fetch events
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!fest) return null;

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      {/* Hero Section */}
      <div className="relative h-[60vh] overflow-hidden">
        {/* Background Image / Overlay */}
        <div className="absolute inset-0 w-full h-full">
          {fest.bannerUrl ? (
            <img 
              src={fest.bannerUrl} 
              alt={fest.festName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-surface-dark bg-grid-pattern opacity-20"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="animate-fade-in-up">
              <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wider mb-4 inline-block shadow-[0_0_15px_rgba(255,122,24,0.5)]">
                {fest.category}
              </span>
              <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-lg">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400">
                  {fest.festName}
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm md:text-base text-gray-300">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {fest.collegeName}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {fest.city || 'Location TBA'}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(fest.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Description Card */}
            <div className="glass-card p-6 md:p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-8 bg-primary rounded-full"></span>
                About The Fest
              </h2>
              <p className="text-gray-300 leading-relaxed text-lg">
                {fest.description}
              </p>
            </div>

            {/* Events Section */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span className="text-primary text-3xl">✦</span>
                  Upcoming Events
                  <span className="text-sm font-normal text-gray-400 bg-white/5 px-2 py-1 rounded ml-2">
                    {events.length}
                  </span>
                </h2>

                {/* Filter Pills */}
                {events.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {domains.map(domain => (
                      <button
                        key={domain}
                        onClick={() => setSelectedDomain(domain)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border ${
                          selectedDomain === domain
                            ? 'bg-primary text-white border-primary shadow-[0_0_10px_rgba(255,122,24,0.4)]'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        {domain}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Events Grid */}
              {filteredEvents.length === 0 ? (
                <div className="glass-panel p-12 text-center border-dashed border-2 border-white/10">
                  <div className="text-gray-500 mb-2 text-4xl">🗓️</div>
                  <h3 className="text-xl font-bold text-white mb-2">No Events Found</h3>
                  <p className="text-gray-400">
                    {events.length === 0 
                      ? 'The organizers are putting together something awesome. Check back soon!' 
                      : `No events found for ${selectedDomain} category.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredEvents.map((event, idx) => (
                    <div 
                      key={event.id} 
                      className="group glass-card overflow-hidden hover:border-primary/50 transition-all duration-300 animate-fade-in-up"
                      style={{ animationDelay: `${0.1 * (idx + 1)}s` }}
                    >
                      {/* Event Image */}
                      <div className="relative h-48 overflow-hidden">
                        {event.bannerUrl ? (
                          <img 
                            src={event.bannerUrl} 
                            alt={event.eventName}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-surface-dark flex items-center justify-center opacity-50">
                            <span className="text-4xl text-white/10 font-black tracking-widest">EVENT</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80"></div>
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                           {isRegistrationOpen(event) ? (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                              OPEN
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/30 backdrop-blur-md">
                              CLOSED
                            </span>
                          )}
                        </div>
                        
                        {/* Domain Badge */}
                        <div className="absolute bottom-3 left-3">
                          <span className="px-3 py-1 bg-black/40 text-white text-xs font-medium rounded-full backdrop-blur-md border border-white/10">
                            {event.domain}
                          </span>
                        </div>
                      </div>
                      
                      {/* Event Details */}
                      <div className="p-5">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                          {event.eventName}
                        </h3>
                        
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2 h-10">
                          {event.description}
                        </p>

                        <div className="space-y-2 text-sm text-gray-300 mb-5">
                          <div className="flex items-center gap-2">
                             <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                             {new Date(event.date).toLocaleDateString()} • {event.time}
                          </div>
                          <div className="flex items-center gap-2">
                             <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                             </svg>
                             {event.venue}
                          </div>
                        </div>

                        <Link
                          to={`/event/${event.id}`}
                          className="btn-primary w-full text-center block py-2.5 text-sm uppercase tracking-wide group-hover:shadow-[0_0_20px_rgba(255,122,24,0.4)] transition-all"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gallery Section */}
            {fest.gallery && fest.gallery.length > 0 && (
              <div className="glass-card p-6 md:p-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-1 h-8 bg-accent rounded-full"></span>
                  Gallery
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {fest.gallery.map((image, idx) => (
                    <div 
                      key={idx} 
                      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-accent/20 transition-all"
                      onClick={() => window.open(image.url, '_blank')}
                    >
                      <img 
                        src={image.url} 
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (Right Column) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              
              {/* Info Card */}
              <div className="glass-panel p-6 border-t-4 border-primary">
                <h3 className="font-bold text-lg mb-4 text-white">Fest Details</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="p-2 bg-white/5 rounded-lg text-primary">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Organized By</span>
                      <span className="text-white font-medium">{fest.collegeName}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm">
                    <div className="p-2 bg-white/5 rounded-lg text-accent">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Location</span>
                      <span className="text-white font-medium">{fest.city || 'TBA'}</span>
                    </div>
                  </div>

                  {fest.contactEmail && (
                    <div className="flex items-start gap-3 text-sm">
                      <div className="p-2 bg-white/5 rounded-lg text-green-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <span className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Contact</span>
                        <a href={`mailto:${fest.contactEmail}`} className="text-white font-medium hover:text-primary transition-colors truncate block max-w-[150px]">
                          {fest.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Connect With Us</h4>
                  <div className="flex gap-2 flex-wrap">
                    {fest.socialMedia?.instagram && (
                      <a href={fest.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-pink-600 rounded transition-colors text-white" aria-label="Instagram">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </a>
                    )}
                    {fest.socialMedia?.linkedin && (
                      <a href={fest.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-blue-600 rounded transition-colors text-white" aria-label="LinkedIn">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                      </a>
                    )}
                    {fest.socialMedia?.twitter && (
                      <a href={fest.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-sky-500 rounded transition-colors text-white" aria-label="Twitter">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                      </a>
                    )}
                    {fest.socialMedia?.youtube && (
                      <a href={fest.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-red-600 rounded transition-colors text-white" aria-label="YouTube">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                      </a>
                    )}
                    {fest.socialMedia?.website && (
                      <a href={fest.socialMedia.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-green-600 rounded transition-colors text-white" aria-label="Website">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Sponsors (Compact) */}
              {fest.sponsors && fest.sponsors.length > 0 && (
                <div className="glass-panel p-6">
                  <h3 className="font-bold text-lg mb-4 text-white">Sponsors</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {fest.sponsors.slice(0, 6).map((sponsor, idx) => (
                      <div key={idx} className="bg-white/5 p-2 rounded flex items-center justify-center hover:bg-white/10 transition-colors tooltip" title={sponsor.name}>
                        <img src={sponsor.logoUrl} alt={sponsor.name} className="h-8 w-full object-contain filter grayscale hover:grayscale-0 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FestDetails;

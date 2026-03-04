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
    <div className="min-h-screen bg-background text-text-primary pb-20">
      {/* Hero Section */}
      <div className="relative h-[350px] overflow-hidden group">
        {/* Background Image / Overlay */}
        <div className="absolute inset-0 w-full h-full">
          {fest.bannerUrl ? (
            <img 
              src={fest.bannerUrl} 
              alt={fest.festName}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-surface-dark bg-grid-pattern opacity-20"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/60 to-transparent"></div>
        </div>

        {/* Hero Content - KEEP TEXT WHITE HERE due to dark overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
            <div className="animate-fade-in-up">
              <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wider mb-2 inline-block shadow-glow-primary">
                {fest.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight drop-shadow-lg text-white">
                  {fest.festName}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-primary text-lg">school</span>
                  {fest.collegeName}
                </div>
                <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-accent text-lg">location_on</span>
                  {fest.city || 'Location TBA'}
                </div>
                <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                   <span className="material-symbols-outlined text-neon-pink text-lg">calendar_month</span>
                  {new Date(fest.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content (Left Column - Spans 3) */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Description Card */}
            <div className="bg-surface-card border border-fest-border rounded-2xl p-6 md:p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-text-primary">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                About The Fest
              </h2>
              <p className="text-text-secondary leading-relaxed text-base scrollbar-hide">
                {fest.description}
              </p>
            </div>

            {/* Events Section */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-text-primary">
                  <span className="material-symbols-outlined text-primary">event_available</span>
                  Upcoming Events
                  <span className="text-xs font-bold text-background bg-text-primary px-2 py-0.5 rounded-full ml-1">
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
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 border ${
                          selectedDomain === domain
                            ? 'bg-primary text-white border-primary shadow-glow-primary'
                            : 'bg-background/50 text-text-secondary border-fest-border hover:border-primary/50 hover:bg-surface-card'
                        }`}
                      >
                        {domain}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Events Grid - Scrollable List */}
              <div className="bg-surface-card border border-fest-border rounded-2xl p-4">
                <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredEvents.length === 0 ? (
                    <div className="p-8 text-center border-dashed border-2 border-fest-border rounded-xl">
                      <div className="text-4xl mb-2">🗓️</div>
                      <h3 className="text-lg font-bold text-text-primary mb-1">No Events Found</h3>
                      <p className="text-text-secondary text-sm">
                        {events.length === 0 
                          ? 'No events listed yet.' 
                          : `No events found for ${selectedDomain}.`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredEvents.map((event, idx) => (
                        <div 
                          key={event.id} 
                          className="group bg-background border border-fest-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col shadow-lg"
                          style={{ animationDelay: `${0.05 * (idx + 1)}s` }}
                        >
                          {/* Card Top: Image + Details */}
                          <div className="flex p-3 gap-4">
                            {/* Image Square */}
                            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden relative bg-surface-dark border border-fest-border">
                              {event.bannerUrl ? (
                                <img 
                                  src={event.bannerUrl} 
                                  alt={event.eventName}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-background/50">
                                  <span className="text-[10px] text-text-muted font-bold">EVENT</span>
                                </div>
                              )}
                            </div>

                            {/* Details: Only Name and Date as requested */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h3 className="text-base font-bold text-text-primary mb-1.5 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                {event.eventName}
                              </h3>
                              
                              <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
                                 <span className="material-symbols-outlined text-primary text-sm">calendar_month</span>
                                 {new Date(event.date).toLocaleDateString(undefined, {month:'short', day:'numeric', year: 'numeric'})}
                              </div>
                            </div>
                          </div>
                          
                          {/* Button - Full Width Bottom */}
                          <Link
                            to={`/event/${event.id}`}
                            className="w-full block py-3 text-xs font-bold text-center bg-primary text-black hover:bg-white transition-colors uppercase tracking-wider"
                          >
                            View Details
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar (Right Column - Spans 1) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              
              {/* Connect With Us (Replaces Info Card) */}
              <div className="bg-surface-card border border-fest-border rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">connect_without_contact</span>
                    Connect With Us
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {fest.socialMedia?.instagram && (
                      <a href={fest.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-background/50 border border-fest-border hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all text-text-secondary hover:text-white shadow-sm hover:shadow-lg" aria-label="Instagram">
                        <span className="text-xl">📷</span> {/* Simple icon or svg */}
                      </a>
                    )}
                    {fest.socialMedia?.linkedin && (
                      <a href={fest.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-background/50 border border-fest-border hover:bg-[#0077b5] rounded-lg transition-all text-text-secondary hover:text-white shadow-sm hover:shadow-lg" aria-label="LinkedIn">
                        <span className="text-xl">💼</span>
                      </a>
                    )}
                    {fest.socialMedia?.website && (
                      <a href={fest.socialMedia.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-background/50 border border-fest-border hover:bg-emerald-500 rounded-lg transition-all text-text-secondary hover:text-white shadow-sm hover:shadow-lg" aria-label="Website">
                        <span className="text-xl">🌐</span>
                      </a>
                    )}
                    {fest.contactEmail && (
                        <a href={`mailto:${fest.contactEmail}`} className="p-2 bg-background/50 border border-fest-border hover:bg-red-500 rounded-lg transition-all text-text-secondary hover:text-white shadow-sm hover:shadow-lg" aria-label="Email">
                            <span className="text-xl">📧</span>
                        </a>
                    )}
                  </div>
              </div>

              {/* Gallery Section (Moved here) */}
              {fest.gallery && fest.gallery.length > 0 && (
                <div className="bg-surface-card border border-fest-border rounded-2xl p-5">
                  <h2 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent text-lg">collections</span>
                    Gallery
                  </h2>
                  <div className="grid grid-cols-3 gap-2">
                    {fest.gallery.slice(0, 9).map((image, idx) => (
                      <div 
                        key={idx} 
                        className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-fest-border hover:border-primary/50 transition-all"
                        onClick={() => window.open(image.url, '_blank')}
                      >
                        <img 
                          src={image.url} 
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                    ))}
                  </div>
                  {fest.gallery.length > 9 && (
                      <button className="w-full mt-3 text-xs text-primary hover:text-white transition-colors py-1.5 border border-primary/20 rounded hover:bg-primary/10">
                          View All ({fest.gallery.length})
                      </button>
                  )}
                </div>
              )}

              {/* Sponsors Removed */}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FestDetails;

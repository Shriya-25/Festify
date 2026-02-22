import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const ManageFest = () => {
  const { festId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [fest, setFest] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFestAndEvents();
  }, [festId]);

  const fetchFestAndEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch fest details
      const festDoc = await getDoc(doc(db, 'fests', festId));
      if (!festDoc.exists()) {
        alert('Fest not found');
        navigate('/dashboard');
        return;
      }

      const festData = { id: festDoc.id, ...festDoc.data() };
      
      // Check ownership
      if (festData.createdBy !== currentUser.uid) {
        alert('You do not have permission to manage this fest');
        navigate('/dashboard');
        return;
      }

      setFest(festData);

      // Fetch events for this fest
      const eventsQuery = query(
        collection(db, 'events'),
        where('festId', '==', festId)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsData = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by date
      eventsData.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventRegistrations = async (eventId) => {
    try {
      setLoadingRegistrations(true);
      const regsQuery = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId)
      );
      const regsSnapshot = await getDocs(regsQuery);
      const regsData = regsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by registration date
      regsData.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
      
      setRegistrations(regsData);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setSearchTerm('');
    fetchEventRegistrations(event.id);
  };

  const handleDownloadCSV = () => {
    if (!selectedEvent || registrations.length === 0) return;

    // Prepare CSV data
    const headers = ['Name', 'Email', 'Phone', 'College', 'Branch', 'Year', 'Gender', 'Registration Date'];
    
    // Add custom field headers if they exist
    if (registrations[0]?.customFields) {
      const customFieldKeys = Object.keys(registrations[0].customFields);
      headers.push(...customFieldKeys);
    }

    const csvRows = [headers.join(',')];

    registrations.forEach(reg => {
      const row = [
        reg.name || 'N/A',
        reg.email || 'N/A',
        reg.phone || 'N/A',
        reg.college || 'N/A',
        reg.branch || 'N/A',
        reg.year || 'N/A',
        reg.gender || 'N/A',
        new Date(reg.registeredAt).toLocaleString()
      ];

      // Add custom field values
      if (reg.customFields) {
        Object.values(reg.customFields).forEach(value => {
          row.push(String(value || 'N/A'));
        });
      }

      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEvent.eventName}_registrations.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredRegistrations = registrations.filter(reg => 
    (reg.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (reg.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isRegistrationOpen = (event) => {
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);
    return now < deadline;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link to="/dashboard" className="text-primary hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{fest?.festName}</h1>
              <p className="text-gray-600">{fest?.collegeName}</p>
            </div>
            <Link
              to={`/fest/${festId}/create-event`}
              className="btn-primary"
            >
              + Add Event
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Events List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Events ({events.length})
              </h2>

              {events.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No events yet</p>
                  <Link
                    to={`/fest/${festId}/create-event`}
                    className="text-primary hover:underline"
                  >
                    Create your first event
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map(event => (
                    <div
                      key={event.id}
                      className="p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div
                            onClick={() => handleEventClick(event)}
                            className="cursor-pointer"
                          >
                            <h3 className="font-semibold text-gray-800">
                              {event.eventName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                {event.domain}
                              </span>
                              {/* Status Badge */}
                              {event.status === 'approved' ? (
                                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                  ✓ Approved
                                </span>
                              ) : event.status === 'rejected' ? (
                                <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                                  ✗ Rejected
                                </span>
                              ) : event.status === 'changes_requested' ? (
                                <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">
                                  📝 Changes Requested
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                                  ⏳ Pending
                                </span>
                              )}
                              {/* Registration Status */}
                              {isRegistrationOpen(event) ? (
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  Open
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  Closed
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              📅 {new Date(event.date).toLocaleDateString()} • 💰 ₹{event.fees || 0}
                            </p>
                            <p className="text-sm text-gray-600">
                              👥 {event.participantCount || 0} registered
                            </p>
                            {event.adminComments && (
                              <div className="mt-2 bg-yellow-50 p-2 rounded text-xs text-yellow-800">
                                <strong>Admin:</strong> {event.adminComments}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => handleEventClick(event)}
                          className={`flex-1 text-sm py-1 px-3 rounded ${
                            selectedEvent?.id === event.id
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          View Registrations
                        </button>
                        <Link
                          to={`/event/${event.id}/edit`}
                          className="flex-1 text-sm py-1 px-3 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-center"
                        >
                          ✏️ Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Registrations Panel */}
          <div className="lg:col-span-2">
            {!selectedEvent ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600">
                  Select an event to view registrations
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedEvent.eventName} - Registrations
                    </h2>
                    <p className="text-gray-600">
                      Total: {registrations.length} students
                    </p>
                  </div>
                  {registrations.length > 0 && (
                    <button
                      onClick={handleDownloadCSV}
                      className="btn-secondary"
                    >
                      📥 Download CSV
                    </button>
                  )}
                </div>

                {loadingRegistrations ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                    <p className="text-gray-600 mt-4">Loading registrations...</p>
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No registrations yet</p>
                  </div>
                ) : (
                  <>
                    {/* Search */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field"
                      />
                    </div>

                    {/* Registrations List */}
                    <div className="space-y-3">
                      {filteredRegistrations.map(reg => (
                        <div
                          key={reg.id}
                          className="block p-4 border rounded-lg bg-white"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                {reg.name}
                              </h3>
                              <p className="text-sm text-gray-600">{reg.email}</p>
                              <p className="text-sm text-gray-600">
                                {reg.college} {reg.branch && `• ${reg.branch}`} {reg.year && `• ${reg.year}`}
                              </p>
                              {reg.phone && (
                                <p className="text-sm text-gray-500 mt-1">📱 {reg.phone}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {new Date(reg.registeredAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageFest;

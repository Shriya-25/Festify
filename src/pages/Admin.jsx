import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

function Admin() {
  const [fests, setFests] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fests'); // 'fests', 'events', or 'users'
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedFest, setSelectedFest] = useState(null);
  const [adminComments, setAdminComments] = useState('');
  const [festStatusFilter, setFestStatusFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected', 'changes_requested'
  const [eventStatusFilter, setEventStatusFilter] = useState('all');

  useEffect(() => {
    fetchFests();
    fetchEvents();
    fetchUsers();
  }, []); 

  const fetchFests = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'fests'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const festsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched fests data:', festsData);
      setFests(festsData);
    } catch (err) {
      console.error('Error fetching fests:', err);
      setError('Failed to load fests');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched events data:', eventsData);
      setEvents(eventsData);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    }
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    }
  };

  const handleApproveFest = async (festId, comments = '') => {
    try {
      await updateDoc(doc(db, 'fests', festId), {
        status: 'approved',
        adminComments: comments,
        reviewedAt: new Date().toISOString()
      });
      setFests(fests.map(fest => 
        fest.id === festId ? { ...fest, status: 'approved', adminComments: comments } : fest
      ));
      alert('Fest approved successfully!');
    } catch (err) {
      console.error('Error approving fest:', err);
      alert('Failed to approve fest');
    }
  };

  const handleRejectFest = async (festId, comments = '') => {
    if (!comments) {
      alert('Please provide comments explaining why the fest is being rejected');
      return;
    }
    try {
      await updateDoc(doc(db, 'fests', festId), {
        status: 'rejected',
        adminComments: comments
      });
      setFests(fests.map(fest => 
        fest.id === festId ? { ...fest, status: 'rejected', adminComments: comments } : fest
      ));
      alert('Fest rejected with comments sent to organizer');
    } catch (err) {
      console.error('Error rejecting fest:', err);
      alert('Failed to reject fest');
    }
  };

  const handleRequestFestChanges = async (festId, comments = '') => {
    if (!comments) {
      alert('Please provide feedback for the requested changes');
      return;
    }
    try {
      await updateDoc(doc(db, 'fests', festId), {
        status: 'changes_requested',
        adminComments: comments
      });
      setFests(fests.map(fest => 
        fest.id === festId ? { ...fest, status: 'changes_requested', adminComments: comments } : fest
      ));
      alert('Change request sent to organizer');
    } catch (err) {
      console.error('Error requesting fest changes:', err);
      alert('Failed to request changes');
    }
  };

  const handleDeleteFest = async (festId) => {
    if (!confirm('Are you sure you want to delete this fest? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'fests', festId));
      setFests(fests.filter(fest => fest.id !== festId));
      alert('Fest deleted successfully');
    } catch (err) {
      console.error('Error deleting fest:', err);
      alert('Failed to delete fest');
    }
  };

  const handleApproveEvent = async (eventId, comments = '') => {
    try {
      await updateDoc(doc(db, 'events', eventId), {
        status: 'approved',
        adminComments: comments,
        approvedAt: new Date().toISOString()
      });
      setEvents(events.map(event => 
        event.id === eventId ? { ...event, status: 'approved', adminComments: comments } : event
      ));
      setSelectedEvent(null);
      setAdminComments('');
      alert('Event approved successfully!');
    } catch (err) {
      console.error('Error approving event:', err);
      alert('Failed to approve event');
    }
  };

  const handleRejectEvent = async (eventId, comments = '') => {
    if (!comments) {
      alert('Please provide comments explaining why the event is being rejected');
      return;
    }
    try {
      await updateDoc(doc(db, 'events', eventId), {
        status: 'rejected',
        adminComments: comments
      });
      setEvents(events.map(event => 
        event.id === eventId ? { ...event, status: 'rejected', adminComments: comments } : event
      ));
      setSelectedEvent(null);
      setAdminComments('');
      alert('Event rejected with comments sent to organizer');
    } catch (err) {
      console.error('Error rejecting event:', err);
      alert('Failed to reject event');
    }
  };

  const handleRequestEventChanges = async (eventId, comments = '') => {
    if (!comments) {
      alert('Please provide feedback for the requested changes');
      return;
    }
    try {
      await updateDoc(doc(db, 'events', eventId), {
        status: 'changes_requested',
        adminComments: comments
      });
      setEvents(events.map(event => 
        event.id === eventId ? { ...event, status: 'changes_requested', adminComments: comments } : event
      ));
      setSelectedEvent(null);
      setAdminComments('');
      alert('Change request sent to organizer');
    } catch (err) {
      console.error('Error requesting event changes:', err);
      alert('Failed to request changes');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'events', eventId));
      setEvents(events.filter(event => event.id !== eventId));
      alert('Event deleted successfully');
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event');
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      alert(`User role updated to ${newRole}`);
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Failed to update user role');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'changes_requested': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border border-purple-300';
      case 'organizer': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'student': return 'bg-green-100 text-green-800 border border-green-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading admin panel...</div>
      </div>
    );
  }

  // Calculate pending counts
  const pendingFests = fests.filter(f => f.status === 'pending' || !f.status).length;
  const pendingEvents = events.filter(e => e.status === 'pending' || !e.status).length;
  const changesRequestedFests = fests.filter(f => f.status === 'changes_requested').length;
  const changesRequestedEvents = events.filter(e => e.status === 'changes_requested').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔐 Admin Panel</h1>
          <p className="mt-2 text-gray-600">Manage fests, events, and users on the platform</p>
        </div>

        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Fests</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingFests}</p>
              </div>
              <div className="text-4xl">🎪</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Events</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingEvents}</p>
              </div>
              <div className="text-4xl">🎯</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Changes Requested</p>
                <p className="text-3xl font-bold text-orange-600">{changesRequestedFests + changesRequestedEvents}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-blue-600">{users.length}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('fests')}
              className={`${
                activeTab === 'fests'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              🎪 Fests ({fests.length})
              {pendingFests > 0 && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                  {pendingFests} Pending
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`${
                activeTab === 'events'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              🎯 Events ({events.length})
              {pendingEvents > 0 && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                  {pendingEvents} Pending
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              👥 Users ({users.length})
            </button>
          </nav>
        </div>

        {/* Fests Tab */}
        {activeTab === 'fests' && (
          <div className="space-y-4">
            {/* Status Filter */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
                <button
                  onClick={() => setFestStatusFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    festStatusFilter === 'all' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All ({fests.length})
                </button>
                <button
                  onClick={() => setFestStatusFilter('pending')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    festStatusFilter === 'pending' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }`}
                >
                  ⏳ Pending ({pendingFests})
                </button>
                <button
                  onClick={() => setFestStatusFilter('changes_requested')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    festStatusFilter === 'changes_requested' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                  }`}
                >
                  📝 Changes Requested ({changesRequestedFests})
                </button>
                <button
                  onClick={() => setFestStatusFilter('approved')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    festStatusFilter === 'approved' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  ✓ Approved ({fests.filter(f => f.status === 'approved' || f.status === 'published').length})
                </button>
                <button
                  onClick={() => setFestStatusFilter('rejected')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    festStatusFilter === 'rejected' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  ✗ Rejected ({fests.filter(f => f.status === 'rejected').length})
                </button>
              </div>
            </div>

            {fests
              .filter(fest => {
                if (festStatusFilter === 'all') return true;
                if (festStatusFilter === 'approved') return fest.status === 'approved' || fest.status === 'published';
                if (festStatusFilter === 'pending') return fest.status === 'pending' || !fest.status;
                return fest.status === festStatusFilter;
              })
              .length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No {festStatusFilter !== 'all' ? festStatusFilter : ''} fests found</p>
              </div>
            ) : (
              fests
                .filter(fest => {
                  if (festStatusFilter === 'all') return true;
                  if (festStatusFilter === 'approved') return fest.status === 'approved' || fest.status === 'published';
                  if (festStatusFilter === 'pending') return fest.status === 'pending' || !fest.status;
                  return fest.status === festStatusFilter;
                })
                .map((fest) => (
                <div
                  key={fest.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
                >
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{fest.festName || 'Unnamed Fest'}</h3>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(
                              fest.status
                            )}`}
                          >
                            {fest.status || 'pending'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-base font-semibold text-gray-700">
                          🏫 {fest.collegeName || 'College not specified'}
                        </p>
                        {fest.organizerName && (
                          <p className="text-sm text-gray-500">
                            👤 Organizer: {fest.organizerName}
                          </p>
                        )}
                        <p className="text-gray-600 leading-relaxed">
                          {fest.description || 'No description provided'}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">📅 Date:</span> 
                          {fest.date ? new Date(fest.date).toLocaleDateString('en-IN', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : 'Not set'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">📍 Venue:</span> 
                          {fest.venue || fest.location || 'Not specified'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">💰 Fee:</span> 
                          ₹{fest.registrationFee || '0'}
                        </span>
                        {fest.createdAt && (
                          <span className="flex items-center gap-1">
                            <span className="font-semibold">🕒 Created:</span> 
                            {new Date(fest.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {(fest.status === 'pending' || fest.status === 'changes_requested') && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedFest(fest);
                              setAdminComments('');
                            }}
                            className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm"
                          >
                            ✓ Review
                          </button>
                        </>
                      )}
                      {fest.status === 'rejected' && (
                        <button
                          onClick={() => {
                            setSelectedFest(fest);
                            setAdminComments('');
                          }}
                          className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm"
                        >
                          ✓ Review
                        </button>
                      )}
                      {(fest.status === 'approved' || fest.status === 'published') && (
                        <button
                          onClick={() => {
                            setSelectedFest(fest);
                            setAdminComments('');
                          }}
                          className="px-5 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium shadow-sm"
                        >
                          📝 Review Again
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteFest(fest.id)}
                        className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Fest Review Modal */}
        {selectedFest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Review Fest: {selectedFest.festName}
              </h3>
              <div className="mb-4">
                <label className="label">Admin Comments (Optional for approval, Required for rejection/changes)</label>
                <textarea
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                  className="input-field"
                  rows="4"
                  placeholder="Provide feedback or reasons for your decision..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleApproveFest(selectedFest.id, adminComments);
                    setSelectedFest(null);
                    setAdminComments('');
                  }}
                  className="btn-primary flex-1"
                >
                  ✓ Approve Fest
                </button>
                <button
                  onClick={() => {
                    handleRequestFestChanges(selectedFest.id, adminComments);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg flex-1"
                >
                  📝 Request Changes
                </button>
                <button
                  onClick={() => {
                    handleRejectFest(selectedFest.id, adminComments);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg flex-1"
                >
                  ✗ Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedFest(null);
                    setAdminComments('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {/* Status Filter */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
                <button
                  onClick={() => setEventStatusFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    eventStatusFilter === 'all' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All ({events.length})
                </button>
                <button
                  onClick={() => setEventStatusFilter('pending')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    eventStatusFilter === 'pending' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }`}
                >
                  ⏳ Pending ({pendingEvents})
                </button>
                <button
                  onClick={() => setEventStatusFilter('changes_requested')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    eventStatusFilter === 'changes_requested' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                  }`}
                >
                  📝 Changes Requested ({changesRequestedEvents})
                </button>
                <button
                  onClick={() => setEventStatusFilter('approved')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    eventStatusFilter === 'approved' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  ✓ Approved ({events.filter(e => e.status === 'approved').length})
                </button>
                <button
                  onClick={() => setEventStatusFilter('rejected')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    eventStatusFilter === 'rejected' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  ✗ Rejected ({events.filter(e => e.status === 'rejected').length})
                </button>
              </div>
            </div>

            {events
              .filter(event => {
                if (eventStatusFilter === 'all') return true;
                if (eventStatusFilter === 'pending') return event.status === 'pending' || !event.status;
                return event.status === eventStatusFilter;
              })
              .length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No {eventStatusFilter !== 'all' ? eventStatusFilter : ''} events found</p>
              </div>
            ) : (
              events
                .filter(event => {
                  if (eventStatusFilter === 'all') return true;
                  if (eventStatusFilter === 'pending') return event.status === 'pending' || !event.status;
                  return event.status === eventStatusFilter;
                })
                .map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
                >
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1 min-w-0">
                      {/* Banner */}
                      {event.bannerUrl && (
                        <img
                          src={event.bannerUrl}
                          alt={event.eventName}
                          className="w-full h-32 object-cover rounded-lg mb-4"
                        />
                      )}
                      
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{event.eventName || 'Unnamed Event'}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(
                                event.status
                              )}`}
                            >
                              {event.status || 'pending'}
                            </span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                              {event.domain}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-base font-semibold text-gray-700">
                          🎪 Fest: {event.festName || 'Not specified'}
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                          {event.description || 'No description provided'}
                        </p>
                        
                        {/* Show registration form details */}
                        {event.registrationForm && event.registrationForm.length > 0 && (
                          <div className="bg-gray-50 p-3 rounded-lg mt-3">
                            <p className="text-sm font-semibold text-gray-700 mb-2">📝 Registration Form Fields:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {event.registrationForm.map((field, idx) => (
                                <li key={idx}>
                                  • {field.label} ({field.type}) {field.required && <span className="text-red-500">*</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">📅 Date:</span> 
                          {event.date ? new Date(event.date).toLocaleDateString('en-IN') : 'Not set'} at {event.time || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">📍 Venue:</span> 
                          {event.venue || 'Not specified'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">💰 Fees:</span> 
                          ₹{event.fees || '0'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">👥 Participants:</span> 
                          {event.participantCount || 0}{event.maxParticipants ? ` / ${event.maxParticipants}` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">⏰ Deadline:</span> 
                          {event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          }) : 'Not set'}
                        </span>
                      </div>
                      
                      {/* Admin Comments */}
                      {event.adminComments && (
                        <div className="mt-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <p className="text-sm font-semibold text-yellow-800">📋 Previous Admin Comments:</p>
                          <p className="text-sm text-yellow-700 mt-1">{event.adminComments}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {event.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedEvent(event);
                              setAdminComments('');
                            }}
                            className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEvent(event);
                              setAdminComments('');
                            }}
                            className="px-5 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium shadow-sm"
                          >
                            ✗ Request Changes
                          </button>
                        </>
                      )}
                      {event.status === 'rejected' && (
                        <button
                          onClick={() => handleApproveEvent(event.id, '')}
                          className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm"
                        >
                          ✓ Approve
                        </button>
                      )}
                      {event.status === 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setAdminComments('');
                          }}
                          className="px-5 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium shadow-sm"
                        >
                          ✗ Unpublish
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Admin Comments Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Review Event: {selectedEvent.eventName}
              </h3>
              <div className="mb-4">
                <label className="label">Admin Comments (Optional for approval, Required for rejection/changes)</label>
                <textarea
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                  className="input-field"
                  rows="4"
                  placeholder="Provide feedback or reasons for your decision..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleApproveEvent(selectedEvent.id, adminComments)}
                  className="btn-primary flex-1"
                >
                  ✓ Approve Event
                </button>
                <button
                  onClick={() => handleRequestEventChanges(selectedEvent.id, adminComments)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg flex-1"
                >
                  📝 Request Changes
                </button>
                <button
                  onClick={() => handleRejectEvent(selectedEvent.id, adminComments)}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg flex-1"
                >
                  ✗ Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    setAdminComments('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auth Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role || 'none'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.authProvider || 'email'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={user.role || ''}
                        onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">No Role</option>
                        <option value="student">Student</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;

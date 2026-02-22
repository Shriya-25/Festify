import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const navigate = useNavigate();
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
  
  // Registration viewing states
  const [viewingRegistrations, setViewingRegistrations] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched users data:', usersData);
      console.log('Total users:', usersData.length);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      // Fallback without ordering if createdAt field doesn't exist on all docs
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched users data (fallback):', usersData);
        setUsers(usersData);
      } catch (fallbackErr) {
        console.error('Error in fallback fetch:', fallbackErr);
        setError('Failed to load users');
      }
    }
  };

  const fetchEventRegistrations = async (eventId) => {
    try {
      setLoadingRegistrations(true);
      const q = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId),
        orderBy('registeredAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const registrationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched registrations:', registrationsData);
      setRegistrations(registrationsData);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      // Fallback: Try without ordering if index doesn't exist
      if (err.code === 'failed-precondition' || err.message?.includes('index')) {
        try {
          console.log('Retrying without ordering...');
          const fallbackQuery = query(
            collection(db, 'eventRegistrations'),
            where('eventId', '==', eventId)
          );
          const querySnapshot = await getDocs(fallbackQuery);
          const registrationsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          // Sort manually by registeredAt
          registrationsData.sort((a, b) => {
            const dateA = new Date(a.registeredAt);
            const dateB = new Date(b.registeredAt);
            return dateB - dateA; // Descending order
          });
          console.log('Fetched registrations (fallback):', registrationsData);
          setRegistrations(registrationsData);
        } catch (fallbackErr) {
          console.error('Fallback query also failed:', fallbackErr);
          alert('Failed to load registrations. Please try again.');
        }
      } else {
        alert('Failed to load registrations');
      }
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleViewRegistrations = (event) => {
    setViewingRegistrations(event);
    fetchEventRegistrations(event.id);
  };

  const handleDownloadCSV = () => {
    if (registrations.length === 0) return;

    const headers = ['Name', 'Email', 'Phone', 'College', 'Branch', 'Year', 'Registered At'];
    const csvData = registrations.map(reg => [
      reg.name || '',
      reg.email || '',
      reg.phone || '',
      reg.college || '',
      reg.branch || '',
      reg.year || '',
      new Date(reg.registeredAt).toLocaleString('en-IN')
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${viewingRegistrations.eventName}_registrations.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      case 'approved': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'published': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'changes_requested': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'organizer': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'student': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-xl text-white">Loading admin panel...</div>
      </div>
    );
  }

  // Calculate pending counts
  const pendingFests = fests.filter(f => f.status === 'pending' || !f.status).length;
  const pendingEvents = events.filter(e => e.status === 'pending' || !e.status).length;
  const changesRequestedFests = fests.filter(f => f.status === 'changes_requested').length;
  const changesRequestedEvents = events.filter(e => e.status === 'changes_requested').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Back Button */}
        <div className="mb-4">
          <button onClick={() => navigate('/')} className="text-primary hover:text-orange-400 transition-colors flex items-center gap-2 text-sm sm:text-base">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
        </div>
        
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Panel</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-400">Manage fests, events, and users on the platform</p>
        </div>

        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="glass-container border border-white/10 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-400">Pending Fests</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-400">{pendingFests}</p>
              </div>
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          
          <div className="glass-container border border-white/10 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-400">Pending Events</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-400">{pendingEvents}</p>
              </div>
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          <div className="glass-container border border-white/10 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-400">Changes Requested</p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-400">{changesRequestedFests + changesRequestedEvents}</p>
              </div>
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
          
          <div className="glass-container border border-white/10 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-400">Total Users</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-400">{users.length}</p>
              </div>
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 glass-container border border-red-500/30 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 glass-container border border-white/10 overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max sm:min-w-0">
            <button
              onClick={() => setActiveTab('fests')}
              className={`${
                activeTab === 'fests'
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-white/30'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="hidden xs:inline">Fests</span> ({fests.length})
              {pendingFests > 0 && (
                <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-bold">
                  {pendingFests}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`${
                activeTab === 'events'
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-white/30'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden xs:inline">Events</span> ({events.length})
              {pendingEvents > 0 && (
                <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-bold">
                  {pendingEvents}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-white/30'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden xs:inline">Users</span> ({users.length})
            </button>
          </nav>
        </div>

        {/* Fests Tab */}
        {activeTab === 'fests' && (
          <div className="space-y-4">
            {/* Status Filter */}
            <div className="glass-container border border-white/10 p-3 sm:p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-medium text-gray-300">Filter by Status:</span>
                <button
                  onClick={() => setFestStatusFilter('all')}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    festStatusFilter === 'all' 
                      ? 'bg-primary text-white' 
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  All ({fests.length})
                </button>
                <button
                  onClick={() => setFestStatusFilter('pending')}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    festStatusFilter === 'pending' 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30'
                  }`}
                >
                  Pending ({pendingFests})
                </button>
                <button
                  onClick={() => setFestStatusFilter('changes_requested')}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    festStatusFilter === 'changes_requested' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30'
                  }`}
                >
                  Changes Requested ({changesRequestedFests})
                </button>
                <button
                  onClick={() => setFestStatusFilter('approved')}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    festStatusFilter === 'approved' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                  }`}
                >
                  Approved ({fests.filter(f => f.status === 'approved' || f.status === 'published').length})
                </button>
                <button
                  onClick={() => setFestStatusFilter('rejected')}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    festStatusFilter === 'rejected' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                  }`}
                >
                  Rejected ({fests.filter(f => f.status === 'rejected').length})
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
              <div className="text-center py-12 glass-container border border-white/10">
                <p className="text-gray-400">No {festStatusFilter !== 'all' ? festStatusFilter : ''} fests found</p>
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
                  className="glass-container border border-white/10 p-4 sm:p-6 hover:border-primary/30 transition-all"
                >
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-1">{fest.festName || 'Unnamed Fest'}</h3>
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
                        <p className="text-base font-semibold text-gray-300">
                          {fest.collegeName || 'College not specified'}
                        </p>
                        {fest.organizerName && (
                          <p className="text-sm text-gray-400">
                            Organizer: {fest.organizerName}
                          </p>
                        )}
                        <p className="text-gray-300 leading-relaxed">
                          {fest.description || 'No description provided'}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">Date:</span> 
                          {fest.date ? new Date(fest.date).toLocaleDateString('en-IN', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : 'Not set'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">Venue:</span> 
                          {fest.venue || fest.location || 'Not specified'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">Fee:</span> 
                          ₹{fest.registrationFee || '0'}
                        </span>
                        {fest.createdAt && (
                          <span className="flex items-center gap-1">
                            <span className="font-semibold">Created:</span> 
                            {new Date(fest.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto sm:min-w-[140px]">
                      {(fest.status === 'pending' || fest.status === 'changes_requested') && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedFest(fest);
                              setAdminComments('');
                            }}
                            className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm flex-1 sm:flex-none"
                          >
                            Review
                          </button>
                        </>
                      )}
                      {fest.status === 'rejected' && (
                        <button
                          onClick={() => {
                            setSelectedFest(fest);
                            setAdminComments('');
                          }}
                          className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm flex-1 sm:flex-none"
                        >
                          Review
                        </button>
                      )}
                      {(fest.status === 'approved' || fest.status === 'published') && (
                        <button
                          onClick={() => {
                            setSelectedFest(fest);
                            setAdminComments('');
                          }}
                          className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium shadow-sm flex-1 sm:flex-none"
                        >
                          Review Again
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteFest(fest.id)}
                        className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm flex-1 sm:flex-none"
                      >
                        Delete
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
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="glass-container border border-white/20 rounded-lg max-w-2xl w-full p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Review Fest: {selectedFest.festName}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Admin Comments (Optional for approval, Required for rejection/changes)</label>
                <textarea
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
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
                >  Approve Fest
                </button>
                <button
                  onClick={() => {
                    handleRequestFestChanges(selectedFest.id, adminComments);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg flex-1"
                >
                  Request Changes
                </button>
                <button
                  onClick={() => {
                    handleRejectFest(selectedFest.id, adminComments);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg flex-1"
                >
                  Reject
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
            <div className="glass-container border border-white/10 p-3 sm:p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-medium text-gray-300">Filter by Status:</span>
                <button
                  onClick={() => setEventStatusFilter('all')}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    eventStatusFilter === 'all' 
                      ? 'bg-primary text-white' 
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  All ({events.length})
                </button>
                <button
                  onClick={() => setEventStatusFilter('pending')}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    eventStatusFilter === 'pending' 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30'
                  }`}
                >
                  Pending ({pendingEvents})
                </button>
                <button
                  onClick={() => setEventStatusFilter('changes_requested')}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    eventStatusFilter === 'changes_requested' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30'
                  }`}
                >
                  Changes Requested ({changesRequestedEvents})
                </button>
                <button
                  onClick={() => setEventStatusFilter('approved')}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    eventStatusFilter === 'approved' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                  }`}
                >
                  Approved ({events.filter(e => e.status === 'approved').length})
                </button>
                <button
                  onClick={() => setEventStatusFilter('rejected')}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    eventStatusFilter === 'rejected' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                  }`}
                >
                  Rejected ({events.filter(e => e.status === 'rejected').length})
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
              <div className="text-center py-12 glass-container border border-white/10">
                <p className="text-gray-400">No {eventStatusFilter !== 'all' ? eventStatusFilter : ''} events found</p>
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
                  className="glass-container border border-white/10 p-4 sm:p-6 hover:border-primary/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6">
                    <div className="flex-1 min-w-0 w-full">
                      {/* Banner */}
                      {event.bannerUrl && (
                        <img
                          src={event.bannerUrl}
                          alt={event.eventName}
                          className="w-full h-32 object-cover rounded-lg mb-4 border border-white/10"
                        />
                      )}
                      
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-1">{event.eventName || 'Unnamed Event'}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(
                                event.status
                              )}`}
                            >
                              {event.status || 'pending'}
                            </span>
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold">
                              {event.domain}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-base font-semibold text-gray-300">
                          Fest: {event.festName || 'Not specified'}
                        </p>
                        <p className="text-gray-300 leading-relaxed">
                          {event.description || 'No description provided'}
                        </p>
                        
                        {/* Show registration form details */}
                        {event.registrationForm && event.registrationForm.length > 0 && (
                          <div className="bg-white/5 p-3 rounded-lg mt-3 border border-white/10">
                            <p className="text-sm font-semibold text-white mb-2">Registration Form Fields:</p>
                            <ul className="text-sm text-gray-400 space-y-1">
                              {event.registrationForm.map((field, idx) => (
                                <li key={idx}>
                                  • {field.label} ({field.type}) {field.required && <span className="text-red-400">*</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">Date:</span> 
                          {event.date ? new Date(event.date).toLocaleDateString('en-IN') : 'Not set'} at {event.time || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">Venue:</span> 
                          {event.venue || 'Not specified'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">Fees:</span> 
                          {event.isPaid ? `₹${event.entryFee}` : 'Free'}
                          {event.isPaid && event.paymentConfig && (
                            <span className="text-xs text-gray-500 ml-2">
                              ({event.paymentConfig.method === 'manual' ? 'Manual QR' : 'Razorpay'})
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">Participants:</span> 
                          {event.participantCount || 0}{event.maxParticipants ? ` / ${event.maxParticipants}` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">Deadline:</span> 
                          {event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          }) : 'Not set'}
                        </span>
                      </div>
                      
                      {/* Admin Comments */}
                      {event.adminComments && (
                        <div className="mt-3 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/30">
                          <p className="text-sm font-semibold text-yellow-400">Previous Admin Comments:</p>
                          <p className="text-sm text-yellow-300 mt-1">{event.adminComments}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto sm:min-w-[140px] flex-wrap">
                      {event.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedEvent(event);
                              setAdminComments('');
                            }}
                            className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm flex-1 sm:flex-none"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEvent(event);
                              setAdminComments('');
                            }}
                            className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium shadow-sm flex-1 sm:flex-none"
                          >
                            Request Changes
                          </button>
                        </>
                      )}
                      {event.status === 'rejected' && (
                        <button
                          onClick={() => handleApproveEvent(event.id, '')}
                          className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm flex-1 sm:flex-none"
                        >
                          Approve
                        </button>
                      )}
                      {event.status === 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setAdminComments('');
                          }}
                          className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium shadow-sm flex-1 sm:flex-none"
                        >
                          Unpublish
                        </button>
                      )}
                      <button
                        onClick={() => handleViewRegistrations(event)}
                        className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm flex-1 sm:flex-none"
                      >
                        View Registrations
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm flex-1 sm:flex-none"
                      >
                        Delete
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
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="glass-container border border-white/20 rounded-lg max-w-2xl w-full p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Review Event: {selectedEvent.eventName}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Admin Comments (Optional for approval, Required for rejection/changes)</label>
                <textarea
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                  rows="4"
                  placeholder="Provide feedback or reasons for your decision..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleApproveEvent(selectedEvent.id, adminComments)}
                  className="btn-primary flex-1"
                >
                  Approve Event
                </button>
                <button
                  onClick={() => handleRequestEventChanges(selectedEvent.id, adminComments)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg flex-1"
                >
                  Request Changes
                </button>
                <button
                  onClick={() => handleRejectEvent(selectedEvent.id, adminComments)}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg flex-1"
                >
                  Reject
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

        {/* View Registrations Modal */}
        {viewingRegistrations && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="glass-container border border-white/20 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 glass-container border-b border-white/10 p-6 z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {viewingRegistrations.eventName} - Registrations
                    </h2>
                    <p className="text-gray-400 mt-1">
                      Total: {registrations.length} student{registrations.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {registrations.length > 0 && (
                      <button
                        onClick={handleDownloadCSV}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                      >
                        Download CSV
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setViewingRegistrations(null);
                        setRegistrations([]);
                        setSearchTerm('');
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Search */}
                {registrations.length > 0 && (
                  <div>
                    <input
                      type="text"
                      placeholder="Search by name, email, or college..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    />
                  </div>
                )}
              </div>

              <div className="p-6">
                {loadingRegistrations ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                    <p className="text-gray-400 mt-4">Loading registrations...</p>
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">No registrations yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {registrations
                      .filter(reg => {
                        if (!searchTerm) return true;
                        const search = searchTerm.toLowerCase();
                        return (
                          reg.name?.toLowerCase().includes(search) ||
                          reg.email?.toLowerCase().includes(search) ||
                          reg.college?.toLowerCase().includes(search)
                        );
                      })
                      .map(reg => (
                        <div
                          key={reg.id}
                          className="block p-4 border border-white/10 rounded-lg glass-container hover:border-primary/30 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white text-lg">
                                {reg.name || 'N/A'}
                              </h3>
                              <p className="text-sm text-gray-400 mt-1">
                                {reg.email || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                {reg.college || 'N/A'}
                                {reg.branch && ` • ${reg.branch}`}
                                {reg.year && ` • ${reg.year}`}
                              </p>
                              {reg.phone && (
                                <p className="text-sm text-gray-400 mt-1">
                                  {reg.phone}
                                </p>
                              )}
                              {reg.formData && Object.keys(reg.formData).length > 0 && (
                                <div className="mt-2 pt-2 border-t border-white/10">
                                  <p className="text-xs font-semibold text-gray-300 mb-1">Additional Info:</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {Object.entries(reg.formData).map(([key, value]) => (
                                      <p key={key} className="text-xs text-gray-400">
                                        <span className="font-medium">{key}:</span> {value || 'N/A'}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-xs text-gray-500">
                                Registered on
                              </p>
                              <p className="text-sm font-medium text-gray-300">
                                {new Date(reg.registeredAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(reg.registeredAt).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    {registrations.filter(reg => {
                      if (!searchTerm) return true;
                      const search = searchTerm.toLowerCase();
                      return (
                        reg.name?.toLowerCase().includes(search) ||
                        reg.email?.toLowerCase().includes(search) ||
                        reg.college?.toLowerCase().includes(search)
                      );
                    }).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No registrations match your search</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="glass-container border border-white/10 rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      College
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Auth Provider
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email Verified
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-white">
                          {user.name || user.displayName || 'Not provided'}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-400">{user.email || 'N/A'}</div>
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-400">{user.phone || 'N/A'}</div>
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
                        <div className="text-xs sm:text-sm text-gray-400 max-w-xs truncate" title={user.college}>
                          {user.college || 'N/A'}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <span
                          className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold uppercase ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role || 'none'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-400">{user.authProvider || 'email'}</div>
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <span
                          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                            user.emailVerified
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {user.emailVerified ? 'Verified' : 'Not Verified'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-400">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-xs sm:text-sm">
                        <select
                          value={user.role || ''}
                          onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="" className="bg-gray-800">No Role</option>
                          <option value="student" className="bg-gray-800">Student</option>
                          <option value="organizer" className="bg-gray-800">Organizer</option>
                          <option value="admin" className="bg-gray-800">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No users found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;

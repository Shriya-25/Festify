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
  const [festStatusFilter, setFestStatusFilter] = useState('all'); 
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
      setFests(festsData);
    } catch (err) {
      console.error('Error fetching fests:', err);
      setError('Failed to load fests');
      setLoading(false);
    } finally {
        // Continue loading other resources even if fests fail, but turn off loading spinner if it was the last one?
        // Actually best to keep loading true until at least one succeeds or we handle it better. 
        // For now let's just ensure loading is false eventually.
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
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      } catch (fallbackErr) {
        console.error('Error in fallback fetch:', fallbackErr);
        setError('Failed to load users');
      }
    } finally {
        setLoading(false);
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
      setRegistrations(registrationsData);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      if (err.code === 'failed-precondition' || err.message?.includes('index')) {
        try {
          const fallbackQuery = query(
            collection(db, 'eventRegistrations'),
            where('eventId', '==', eventId)
          );
          const querySnapshot = await getDocs(fallbackQuery);
          const registrationsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          registrationsData.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
          setRegistrations(registrationsData);
        } catch (fallbackErr) {
          alert('Failed to load registrations. Please try again.');
        }
      } else {
        alert('Failed to load registrations');
      }
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!registrations.length) return;
    
    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'College', 'Department', 'Year', 'Registered At'];
    const csvContent = [
      headers.join(','),
      ...registrations.map(reg => [
        `"${reg.name || ''}"`,
        `"${reg.email || ''}"`,
        `"${reg.phone || ''}"`,
        `"${reg.college || ''}"`,
        `"${reg.department || ''}"`,
        `"${reg.year || ''}"`,
        `"${reg.registeredAt ? new Date(reg.registeredAt).toLocaleString() : ''}"`
      ].join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${viewingRegistrations.eventName.replace(/\s+/g, '_')}_registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewRegistrations = (event) => {
    setViewingRegistrations(event);
    fetchEventRegistrations(event.id);
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
      if (selectedFest?.id === festId) setSelectedFest(null);
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
      if (selectedEvent?.id === eventId) setSelectedEvent(null);
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

  // --- Render Helpers ---

  const pendingFests = fests.filter(f => f.status === 'pending' || !f.status).length;
  const pendingEvents = events.filter(e => e.status === 'pending' || !e.status).length;

  const getQueueItems = () => {
    let items = [];
    if (activeTab === 'events') {
       items = events;
       if (eventStatusFilter !== 'all') {
         if (eventStatusFilter === 'pending') items = items.filter(e => e.status === 'pending' || !e.status);
         else items = items.filter(e => e.status === eventStatusFilter);
       }
    } else if (activeTab === 'users') {
       items = users;
       // Add user filter logic if needed
    } else { // fests
       items = fests;
       if (festStatusFilter !== 'all') {
         if (festStatusFilter === 'pending') items = items.filter(f => f.status === 'pending' || !f.status);
         else items = items.filter(f => f.status === festStatusFilter);
       }
    }
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        items = items.filter(item => 
            (item.festName && item.festName.toLowerCase().includes(term)) ||
            (item.eventName && item.eventName.toLowerCase().includes(term)) ||
            (item.displayName && item.displayName.toLowerCase().includes(term)) ||
            (item.email && item.email.toLowerCase().includes(term))
        );
    }
    
    return items;
  };

  const queueItems = getQueueItems();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1F] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0F1F] font-sans text-[#F4F7FA]">
      {/* Side Navigation */}
      <aside className="w-64 flex-shrink-0 bg-[#070C18] border-r border-white/5 flex flex-col z-50">
        <div className="p-6 flex flex-col gap-1 cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="text-[#3ABEFF] text-2xl font-bold tracking-tight">Festify</h1>
          <p className="text-[#9BA3B4] text-xs font-medium uppercase tracking-wider">Platform Admin</p>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('fests')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'fests' ? 'bg-[#3ABEFF]/10 text-[#3ABEFF] font-semibold' : 'text-[#9BA3B4] hover:bg-white/5 hover:text-[#3ABEFF]'}`}
          >
            <span className="material-symbols-outlined fill-1">verified</span>
            <span className="text-sm">Fests</span>
          </button>
          <button 
            onClick={() => setActiveTab('events')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'events' ? 'bg-[#3ABEFF]/10 text-[#3ABEFF] font-semibold' : 'text-[#9BA3B4] hover:bg-white/5 hover:text-[#3ABEFF]'}`}
          >
            <span className="material-symbols-outlined">calendar_month</span>
            <span className="text-sm">Events</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-[#3ABEFF]/10 text-[#3ABEFF] font-semibold' : 'text-[#9BA3B4] hover:bg-white/5 hover:text-[#3ABEFF]'}`}
          >
            <span className="material-symbols-outlined">group</span>
            <span className="text-sm">Users</span>
          </button>
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-2">
            <div className="h-10 w-10 rounded-full bg-[#3ABEFF]/20 flex items-center justify-center overflow-hidden text-[#3ABEFF]">
               <span className="material-symbols-outlined">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">Administrator</p>
              <p className="text-[#9BA3B4] text-xs font-medium uppercase tracking-wider">Online</p>
            </div>
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-200" title="Exit Admin">
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative before:fixed before:inset-0 before:bg-[radial-gradient(circle_at_20%_30%,rgba(58,190,255,0.1),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(0,136,255,0.08),transparent_40%)] before:-z-10 before:pointer-events-none">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-[#0A0F1F]/60 backdrop-blur-xl border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <span className="material-symbols-outlined">search</span>
              </span>
              <input 
                className="block w-full pl-10 pr-3 py-2 border-none rounded-lg bg-white/5 text-sm text-[#F4F7FA] placeholder:text-[#9BA3B4] focus:ring-2 focus:ring-[#3ABEFF]/50 transition-all outline-none" 
                placeholder={`Search ${activeTab}...`}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button className="p-2 text-slate-500 hover:bg-white/5 rounded-lg relative transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                {pendingFests + pendingEvents > 0 && <span className="absolute top-2 right-2.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0A0F1F]"></span>}
             </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[rgba(24,34,58,0.6)] backdrop-blur-xl p-6 rounded-2xl border border-white/10 flex flex-col gap-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-[#3ABEFF]/20 rounded-lg">
                  <span className="material-symbols-outlined text-[#3ABEFF]">group</span>
                </div>
              </div>
              <div>
                <p className="text-[#9BA3B4] text-sm font-medium">Total Users</p>
                <h3 className="text-2xl font-bold mt-1 text-[#F4F7FA]">{users.length}</h3>
              </div>
            </div>
            
            <div className="bg-[rgba(24,34,58,0.6)] backdrop-blur-xl p-6 rounded-2xl border border-white/10 flex flex-col gap-4 shadow-lg">
              <div className="flex items-center justify-between">
                 <div className="p-2 bg-[#9D00FF]/20 rounded-lg">
                  <span className="material-symbols-outlined text-[#9D00FF]">confirmation_number</span>
                </div>
              </div>
              <div>
                <p className="text-[#9BA3B4] text-sm font-medium">Total Fests</p>
                <h3 className="text-2xl font-bold mt-1 text-[#F4F7FA]">{fests.length}</h3>
              </div>
            </div>

             <div className="bg-[rgba(24,34,58,0.6)] backdrop-blur-xl p-6 rounded-2xl border border-white/10 flex flex-col gap-4 shadow-lg">
              <div className="flex items-center justify-between">
                 <div className="p-2 bg-emerald-400/20 rounded-lg">
                  <span className="material-symbols-outlined text-emerald-400">payments</span>
                </div>
              </div>
              <div>
                <p className="text-[#9BA3B4] text-sm font-medium">Events</p>
                <h3 className="text-2xl font-bold mt-1 text-[#F4F7FA]">{events.length}</h3>
              </div>
            </div>

             <div className="bg-[rgba(24,34,58,0.6)] backdrop-blur-xl p-6 rounded-2xl border border-white/10 flex flex-col gap-4 shadow-lg">
              <div className="flex items-center justify-between">
                 <div className="p-2 bg-amber-400/20 rounded-lg">
                  <span className="material-symbols-outlined text-amber-400">pending_actions</span>
                </div>
                {(pendingFests + pendingEvents > 0) && <span className="text-xs font-bold text-[#FF007A] bg-[#FF007A]/10 px-2.5 py-1 rounded-full">Action Needed</span>}
              </div>
              <div>
                <p className="text-[#9BA3B4] text-sm font-medium">Pending Approvals</p>
                <h3 className="text-2xl font-bold mt-1 text-[#F4F7FA]">{pendingFests + pendingEvents}</h3>
              </div>
            </div>
          </div>

          {/* Grid: Queue & Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: List/Table */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold capitalize text-white">{activeTab} Queue</h2>
                
                {/* Status Filter for Fests/Events */}
                {activeTab !== 'users' && (
                  <div className="flex gap-2">
                     <button 
                        onClick={() => activeTab === 'fests' ? setFestStatusFilter('all') : setEventStatusFilter('all')}
                        className={`text-xs px-2 py-1 rounded-md border ${festStatusFilter === 'all' && eventStatusFilter === 'all' ? 'bg-[#3ABEFF]/20 border-[#3ABEFF] text-[#3ABEFF]' : 'border-white/10 text-[#9BA3B4]'}`}
                     >
                        All
                     </button>
                     <button 
                        onClick={() => activeTab === 'fests' ? setFestStatusFilter('pending') : setEventStatusFilter('pending')}
                        className={`text-xs px-2 py-1 rounded-md border ${festStatusFilter === 'pending' || eventStatusFilter === 'pending' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'border-white/10 text-[#9BA3B4]'}`}
                     >
                        Pending
                     </button>
                  </div>
                )}
              </div>
              
              <div className="bg-[rgba(24,34,58,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-lg min-h-[400px]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9BA3B4]">Name</th>
                        {activeTab === 'users' ? (
                            <>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9BA3B4]">Email</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9BA3B4]">Role</th>
                            </>
                        ) : (
                            <>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9BA3B4]">Organizer</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9BA3B4]">Status</th>
                            </>
                        )}
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9BA3B4]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {queueItems.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="px-6 py-8 text-center text-[#9BA3B4]">No items found.</td>
                        </tr>
                      ) : (
                        queueItems.map(item => (
                            <tr 
                                key={item.id} 
                                className={`hover:bg-white/5 transition-colors cursor-pointer ${(selectedFest?.id === item.id || selectedEvent?.id === item.id) ? 'bg-[#3ABEFF]/10 border-l-2 border-[#3ABEFF]' : ''}`}
                                onClick={() => {
                                    if(activeTab === 'fests') {
                                        setSelectedFest(item);
                                        setAdminComments(item.adminComments || '');
                                    }
                                    else if(activeTab === 'events') {
                                        setSelectedEvent(item);
                                        setAdminComments(item.adminComments || '');
                                    }
                                    else if(activeTab === 'users') {
                                        // Just select it if needed, or handle edit inline
                                    }
                                }}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded bg-white/5 flex items-center justify-center text-[#9BA3B4]">
                                            <span className="material-symbols-outlined">
                                                {activeTab === 'users' ? 'person' : (activeTab === 'events' ? 'event' : 'festival')}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#F4F7FA]">{item.festName || item.eventName || item.displayName || 'Unnamed'}</p>
                                            <p className="text-xs text-[#9BA3B4] italic">{item.category || item.domain || item.role || 'Uncategorized'}</p>
                                        </div>
                                    </div>
                                </td>
                                
                                {activeTab === 'users' ? (
                                    <>
                                        <td className="px-6 py-4 text-sm text-[#9BA3B4]">{item.email}</td>
                                        <td className="px-6 py-4">
                                            <select
                                              value={item.role || 'student'}
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={(e) => handleChangeUserRole(item.id, e.target.value)}
                                              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#3ABEFF]"
                                            >
                                              <option value="student" className="bg-[#0A0F1F]">Student</option>
                                              <option value="organizer" className="bg-[#0A0F1F]">Organizer</option>
                                              <option value="admin" className="bg-[#0A0F1F]">Admin</option>
                                            </select>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-6 py-4 text-sm text-[#9BA3B4]">{item.organizerName || item.collegeName || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${
                                                item.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                                item.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                item.status === 'changes_requested' ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {item.status || 'Pending'}
                                            </span>
                                        </td>
                                    </>
                                )}
                                
                                <td className="px-6 py-4">
                                    <button className="text-[#3ABEFF] hover:text-white transition-colors text-sm font-bold">
                                        {activeTab === 'users' ? 'Edit' : 'Review'}
                                    </button>
                                </td>
                            </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Review Details Panel */}
            <div className="flex flex-col gap-4">
               <h2 className="text-xl font-bold text-white">Review Details</h2>
               
               {activeTab !== 'users' && (selectedFest || selectedEvent) ? (
                   <div className="bg-[rgba(24,34,58,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg flex flex-col gap-6 sticky top-8">
                        {/* Detail Content */}
                        <div className="space-y-4">
                            {(selectedFest?.bannerUrl || selectedEvent?.bannerUrl) && (
                                <div className="aspect-video w-full rounded-lg bg-black/20 overflow-hidden relative">
                                    <img 
                                        src={selectedFest?.bannerUrl || selectedEvent?.bannerUrl} 
                                        alt="Banner" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {e.target.style.display = 'none'}}
                                    />
                                </div>
                            )}
                            
                            <div>
                                <h4 className="text-lg font-bold text-[#F4F7FA]">
                                    {selectedFest?.festName || selectedEvent?.eventName}
                                </h4>
                                <p className="text-sm text-[#9BA3B4] leading-relaxed mt-1 max-h-40 overflow-y-auto">
                                    {selectedFest?.description || selectedEvent?.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                                    <p className="text-[10px] uppercase font-bold text-[#9BA3B4] tracking-wider">Date</p>
                                    <p className="text-xs font-semibold mt-0.5 text-[#F4F7FA]">
                                        {new Date(selectedFest?.date || selectedEvent?.date || Date.now()).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                                    <p className="text-[10px] uppercase font-bold text-[#9BA3B4] tracking-wider">Location</p>
                                    <p className="text-xs font-semibold mt-0.5 text-[#F4F7FA]">
                                        {selectedFest?.venue || selectedEvent?.venue || 'TBA'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#9BA3B4]">Admin Comments</label>
                            <textarea 
                                className="w-full p-3 text-sm rounded-xl border border-white/10 bg-white/5 text-[#F4F7FA] placeholder:text-[#9BA3B4] focus:outline-none focus:ring-2 focus:ring-[#3ABEFF]/50 transition-all resize-none"
                                placeholder="Provide feedback..."
                                rows="3"
                                value={adminComments}
                                onChange={(e) => setAdminComments(e.target.value)}
                            ></textarea>
                        </div>
                        
                        <div className="flex flex-col gap-2 pt-2">
                            <button 
                                onClick={() => {
                                    if(selectedFest) handleApproveFest(selectedFest.id, adminComments);
                                    if(selectedEvent) handleApproveEvent(selectedEvent.id, adminComments);
                                }}
                                className="w-full bg-gradient-to-r from-[#3ABEFF] to-[#0088FF] text-white py-3 rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(58,190,255,0.4)] transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                Approve
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => {
                                        if(selectedFest) handleRequestFestChanges(selectedFest.id, adminComments);
                                        if(selectedEvent) handleRequestEventChanges(selectedEvent.id, adminComments);
                                    }}
                                    className="bg-white/5 text-white/70 py-2.5 rounded-lg font-bold text-sm hover:bg-white/10 transition-all"
                                >
                                    Request Changes
                                </button>
                                <button 
                                    onClick={() => {
                                        if(selectedFest) handleDeleteFest(selectedFest.id);
                                        if(selectedEvent) handleDeleteEvent(selectedEvent.id);
                                    }}
                                    className="bg-red-500/10 text-red-500 py-2.5 rounded-lg font-bold text-sm hover:bg-red-500/20 transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                            
                            {selectedEvent && (
                                <button
                                    onClick={() => handleViewRegistrations(selectedEvent)}
                                    className="mt-2 w-full border border-[#3ABEFF]/30 text-[#3ABEFF] py-2.5 rounded-xl font-bold text-sm hover:bg-[#3ABEFF]/10 transition-all"
                                >
                                    View Registrations
                                </button>
                            )}
                        </div>
                   </div>
               ) : (
                   <div className="bg-[rgba(24,34,58,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-lg text-center">
                        <span className="material-symbols-outlined text-4xl text-[#9BA3B4]/50 mb-4">touch_app</span>
                        <p className="text-[#9BA3B4]">
                           {activeTab === 'users' ? 'User management in list view.' : 'Select an item from the queue to review details.'}
                        </p>
                   </div>
               )}
            </div>
          </div>
        </div>
      </main>

      {/* Registrations Modal Overlay */}
      {viewingRegistrations && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-[#0A0F1F] border border-white/20 rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto relative">
              <button
                  onClick={() => setViewingRegistrations(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
              </button>

              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  Registrations: {viewingRegistrations.eventName}
                </h3>
                <button
                    onClick={handleDownloadCSV}
                    className="flex items-center gap-2 bg-[#3ABEFF]/20 text-[#3ABEFF] px-4 py-2 rounded-lg hover:bg-[#3ABEFF]/30 transition mr-8"
                >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export CSV
                </button>
              </div>
              
              {loadingRegistrations ? (
                <div className="text-center py-8 text-gray-400">Loading registrations...</div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No registrations found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mobile</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {registrations.map((reg) => (
                        <tr key={reg.id}>
                          <td className="px-4 py-3 text-sm text-gray-300">{reg.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">{reg.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">{reg.phone}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                             {new Date(reg.registeredAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

export default Admin;

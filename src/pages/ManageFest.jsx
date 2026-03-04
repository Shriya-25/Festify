import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
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
  const [showPaymentProof, setShowPaymentProof] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

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

  const handleVerifyPayment = async (registrationId, registrationData) => {
    if (!window.confirm('Are you sure you want to verify this payment?')) {
      return;
    }

    try {
      setVerifyingPayment(true);
      await updateDoc(doc(db, 'eventRegistrations', registrationId), {
        paymentVerified: true,
        'paymentProof.paymentStatus': 'verified',
        verifiedAt: new Date().toISOString()
      });

      // Update local state
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId 
          ? { 
              ...reg, 
              paymentVerified: true, 
              paymentProof: { 
                ...reg.paymentProof, 
                paymentStatus: 'verified' 
              } 
            }
          : reg
      ));

      alert('Payment verified successfully!');
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Failed to verify payment. Please try again.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleRejectPayment = async (registrationId) => {
    const reason = window.prompt('Enter reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    try {
      setVerifyingPayment(true);
      await updateDoc(doc(db, 'eventRegistrations', registrationId), {
        paymentVerified: false,
        'paymentProof.paymentStatus': 'rejected',
        'paymentProof.rejectionReason': reason || 'Payment verification failed',
        rejectedAt: new Date().toISOString()
      });

      // Update local state
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId 
          ? { 
              ...reg, 
              paymentVerified: false, 
              paymentProof: { 
                ...reg.paymentProof, 
                paymentStatus: 'rejected',
                rejectionReason: reason || 'Payment verification failed'
              } 
            }
          : reg
      ));

      alert('Payment rejected.');
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment. Please try again.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!selectedEvent || registrations.length === 0) return;

    // Prepare CSV data
    const headers = ['Name', 'Email', 'Phone', 'College', 'Branch', 'Year', 'Gender', 'Registration Date'];
    
    // Add payment headers if event is paid
    if (selectedEvent.isPaid) {
      headers.push('Payment Status', 'Payment Method', 'Transaction ID', 'Razorpay Payment ID', 'Payment Verified', 'Original Amount', 'Coupon Code', 'Discount %', 'Discount Amount', 'Final Paid Amount');
    }
    
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

      // Add payment data if event is paid
      if (selectedEvent.isPaid) {
        row.push(
          reg.paymentProof?.paymentStatus || 'N/A',
          reg.paymentProof?.paymentMethod || 'manual',
          reg.paymentProof?.transactionId || 'N/A',
          reg.paymentProof?.razorpay_payment_id || 'N/A',
          reg.paymentVerified ? 'Yes' : 'No',
          reg.couponUsed?.originalAmount || reg.paymentProof?.originalAmount || selectedEvent.entryFee || 'N/A',
          reg.couponUsed?.code || 'None',
          reg.couponUsed?.discountPercent || '0',
          reg.couponUsed?.discountAmount || '0',
          reg.couponUsed?.finalAmount || reg.paymentProof?.finalAmount || selectedEvent.entryFee || 'N/A'
        );
      }

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

  // Calculate total funds collected for selected event
  const calculateTotalFunds = () => {
    if (!selectedEvent || !selectedEvent.isPaid) return 0;
    
    // Count only verified/successful payments
    const verifiedCount = registrations.filter(reg => 
      reg.paymentProof && 
      (reg.paymentProof.paymentStatus === 'verified' || reg.paymentProof.paymentStatus === 'success')
    ).length;
    
    return verifiedCount * selectedEvent.entryFee;
  };

  // Calculate funds for a specific event (for event card display)
  const calculateEventFunds = (event) => {
    if (!event.isPaid) return 0;
    
    // This is a rough estimate based on participant count
    // In reality, we'd need to query registrations, but that would be expensive
    // So we're assuming all participants have paid (verified)
    // For more accuracy, you'd cache this value when verifying payments
    return event.participantCount * event.entryFee;
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
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Link to="/dashboard" className="text-primary hover:text-primary/80 mb-4 inline-flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">{fest?.festName}</h1>
              <p className="text-sm sm:text-base text-text-secondary">{fest?.collegeName}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                to={`/fest/${festId}/edit`}
                className="btn-secondary text-sm sm:text-base py-2 sm:py-2.5 px-4 sm:px-6 w-full sm:w-auto text-center flex items-center justify-center"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Fest
              </Link>
              <Link
                to={`/fest/${festId}/create-event`}
                className="btn-primary text-sm sm:text-base py-2 sm:py-2.5 px-4 sm:px-6 w-full sm:w-auto text-center flex items-center justify-center"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Event
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Events List */}
          <div className="lg:col-span-1">
            <div className="glass-container p-4 sm:p-6 border border-fest-border bg-surface-card">
              <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-4">
                Events ({events.length})
              </h2>

              {events.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm sm:text-base text-text-secondary mb-4">No events yet</p>
                  <Link
                    to={`/fest/${festId}/create-event`}
                    className="text-sm sm:text-base text-primary hover:text-primary/80 transition-colors"
                  >
                    Create your first event
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {events.map(event => (
                    <div
                      key={event.id}
                      className="rounded-xl sm:rounded-2xl border border-fest-border bg-background hover:bg-surface-card transition overflow-hidden shadow-sm hover:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row items-start">
                        {/* Event Banner Thumbnail */}
                        {event.bannerUrl && (
                          <div className="w-full sm:w-24 md:w-32 h-32 sm:h-24 md:h-32 flex-shrink-0 bg-surface-dark overflow-hidden relative">
                            <img 
                              src={event.bannerUrl} 
                              alt={event.eventName}
                              className="w-full h-full object-cover"
                            />
                            {/* Overlay just in case image is bad */}
                            <div className="absolute inset-0 bg-black/10"></div>
                          </div>
                        )}
                        
                        <div className="flex-1 p-3 sm:p-4">
                          <div
                            onClick={() => handleEventClick(event)}
                            className="cursor-pointer"
                          >
                            <h3 className="text-sm sm:text-base font-semibold text-text-primary">
                              {event.eventName}
                            </h3>
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                              <span className="badge badge-{event.domain === 'Technical' ? 'tech' : event.domain === 'Cultural' ? 'culture' : 'sports'}">
                                {event.domain}
                              </span>
                              {/* Status Badge */}
                              {event.status === 'approved' ? (
                                <span className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] sm:text-xs font-semibold rounded-full border border-green-500/30">
                                  Approved
                                </span>
                              ) : event.status === 'rejected' ? (
                                <span className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] sm:text-xs font-semibold rounded-full border border-red-500/30">
                                  Rejected
                                </span>
                              ) : event.status === 'changes_requested' ? (
                                <span className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] sm:text-xs font-semibold rounded-full border border-orange-500/30">
                                  Changes Requested
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[10px] sm:text-xs font-semibold rounded-full border border-yellow-500/30">
                                  Pending
                                </span>
                              )}
                              {/* Registration Status */}
                              {isRegistrationOpen(event) ? (
                                <span className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs rounded-full border border-blue-500/30">
                                  Open
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-500/20 text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs rounded-full border border-gray-500/30">
                                  Closed
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-text-secondary mt-2">
                              {new Date(event.date).toLocaleDateString()} • {event.isPaid ? `₹${event.entryFee}` : 'Free'}
                            </p>
                            <p className="text-xs sm:text-sm text-text-secondary">
                              {event.participantCount || 0} registered
                            </p>
                            {event.isPaid && event.participantCount > 0 && (
                              <p className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 mt-1">
                                Funds: ₹{calculateEventFunds(event)}
                              </p>
                            )}
                            {event.adminComments && (
                              <div className="mt-2 bg-yellow-500/10 p-2 rounded-lg text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                                <strong>Admin:</strong> {event.adminComments}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 p-2 sm:p-3 md:p-4 pt-2 border-t border-fest-border">
                        <button
                          onClick={() => handleEventClick(event)}
                          className={`flex-1 text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl transition-colors ${
                            selectedEvent?.id === event.id
                              ? 'bg-primary text-white shadow-glow'
                              : 'bg-background hover:bg-background/80 text-text-secondary border border-fest-border'
                          }`}
                        >
                          View Registrations
                        </button>
                        <Link
                          to={`/event/${event.id}/edit`}
                          className="flex-1 text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30 text-center border border-blue-500/30 transition-colors"
                        >
                          Edit
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
              <div className="glass-container p-6 sm:p-8 md:p-12 text-center border border-fest-border bg-surface-card">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-text-secondary text-sm sm:text-base md:text-lg">
                  Select an event to view registrations
                </p>
              </div>
            ) : (
              <div className="glass-container p-4 sm:p-6 border border-fest-border bg-surface-card">
                <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-2">
                      {selectedEvent.eventName} - Registrations
                    </h2>
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                      <p className="text-xs sm:text-sm text-text-secondary">
                        Total: <span className="font-semibold text-text-primary">{registrations.length}</span> students
                      </p>
                      {selectedEvent.isPaid && registrations.length > 0 && (
                        <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-semibold">
                          Total Collected: ₹{calculateTotalFunds()}
                        </p>
                      )}
                    </div>
                  </div>
                  {registrations.length > 0 && (
                    <button
                      onClick={handleDownloadCSV}
                      className="btn-secondary text-sm sm:text-base py-2 sm:py-2.5 px-3 sm:px-4 w-full sm:w-auto"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download CSV
                    </button>
                  )}
                </div>

                {loadingRegistrations ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm sm:text-base text-text-secondary mt-4">Loading registrations...</p>
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm sm:text-base text-text-secondary">No registrations yet</p>
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
                    <div className="space-y-3 sm:space-y-4">
                      {filteredRegistrations.map(reg => (
                        <div
                          key={reg.id}
                          className="block p-3 sm:p-4 border border-fest-border rounded-xl sm:rounded-2xl bg-background hover:bg-surface-card transition-colors shadow-sm hover:shadow-md"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
                            <div className="flex-1">
                              <h3 className="text-sm sm:text-base font-semibold text-text-primary">
                                {reg.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-text-secondary">{reg.email}</p>
                              <p className="text-xs sm:text-sm text-text-secondary">
                                {reg.college} {reg.branch && `• ${reg.branch}`} {reg.year && `• ${reg.year}`}
                              </p>
                              {reg.phone && (
                                <p className="text-xs sm:text-sm text-text-muted mt-1">📱 {reg.phone}</p>
                              )}
                              
                              {/* Payment Status */}
                              {selectedEvent.isPaid && reg.paymentProof && (
                                <div className="mt-2 sm:mt-3 space-y-2">
                                  <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                                    <span className="text-xs sm:text-sm font-medium text-text-secondary">Payment Status:</span>
                                    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${
                                      reg.paymentProof.paymentStatus === 'verified' || reg.paymentProof.paymentStatus === 'success'
                                        ? 'bg-green-100 text-green-800'
                                        : reg.paymentProof.paymentStatus === 'rejected'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {(reg.paymentProof.paymentStatus === 'verified' || reg.paymentProof.paymentStatus === 'success') && '✓ Verified'}
                                      {reg.paymentProof.paymentStatus === 'rejected' && '✗ Rejected'}
                                      {reg.paymentProof.paymentStatus === 'pending_verification' && '⏳ Pending'}
                                    </span>
                                    {reg.paymentProof.paymentMethod === 'razorpay' && (
                                      <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded border border-purple-500/30">
                                        Razorpay
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Coupon Information */}
                                  {reg.couponUsed && reg.couponUsed.code && (
                                    <div className="bg-green-500/10 border border-green-500/30 rounded p-2 mt-2">
                                      <p className="text-[10px] sm:text-xs font-semibold text-green-600 dark:text-green-400">🎟️ Coupon Applied: {reg.couponUsed.code}</p>
                                      <div className="flex flex-wrap justify-between gap-2 text-[10px] sm:text-xs text-text-secondary mt-1">
                                        <span>Original: ₹{reg.couponUsed.originalAmount}</span>
                                        <span className="text-green-600 dark:text-green-400 font-semibold">{reg.couponUsed.discountPercent}% OFF</span>
                                        <span className="font-semibold">Paid: ₹{reg.couponUsed.finalAmount}</span>
                                      </div>
                                      <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 mt-1">Saved: ₹{reg.couponUsed.discountAmount.toFixed(2)}</p>
                                    </div>
                                  )}
                                  
                                  {reg.paymentProof.transactionId && (
                                    <p className="text-[10px] sm:text-xs text-text-muted">
                                      Transaction ID: {reg.paymentProof.transactionId}
                                    </p>
                                  )}
                                  
                                  {reg.paymentProof.razorpay_payment_id && (
                                    <p className="text-[10px] sm:text-xs text-text-muted">
                                      Razorpay ID: {reg.paymentProof.razorpay_payment_id}
                                    </p>
                                  )}
                                  
                                  {/* Verification buttons for pending payments */}
                                  {reg.paymentProof.paymentStatus === 'pending_verification' && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <button
                                        onClick={() => setShowPaymentProof(reg)}
                                        className="text-[10px] sm:text-xs bg-blue-500 text-white px-2 sm:px-3 py-1 rounded hover:bg-blue-600"
                                      >
                                        View Proof
                                      </button>
                                      <button
                                        onClick={() => handleVerifyPayment(reg.id, reg)}
                                        disabled={verifyingPayment}
                                        className="text-[10px] sm:text-xs bg-green-500 text-white px-2 sm:px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                                      >
                                        ✓ Verify
                                      </button>
                                      <button
                                        onClick={() => handleRejectPayment(reg.id)}
                                        disabled={verifyingPayment}
                                        className="text-[10px] sm:text-xs bg-red-500 text-white px-2 sm:px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                                      >
                                        ✗ Reject
                                      </button>
                                    </div>
                                  )}
                                  
                                  {reg.paymentProof.paymentStatus === 'verified' && (
                                    <button
                                      onClick={() => setShowPaymentProof(reg)}
                                      className="text-[10px] sm:text-xs text-blue-500 hover:underline"
                                    >
                                      View Payment Proof
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right sm:ml-4">
                              <p className="text-[10px] sm:text-xs text-text-muted">
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

        {/* Payment Proof Modal */}
        {showPaymentProof && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="glass-container border border-fest-border bg-surface-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-surface-card border-b border-fest-border p-4 sm:p-6 flex justify-between items-center z-10">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary">
                  Payment Proof - {showPaymentProof.name}
                </h2>
                <button
                  onClick={() => setShowPaymentProof(null)}
                  className="text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-text-primary mb-2 sm:mb-3">Student Details</h3>
                  <div className="bg-background rounded-lg sm:rounded-xl p-3 sm:p-4 border border-fest-border space-y-2">
                    <p className="text-xs sm:text-sm text-text-secondary"><strong className="text-text-primary">Name:</strong> {showPaymentProof.name}</p>
                    <p className="text-xs sm:text-sm text-text-secondary"><strong className="text-text-primary">Email:</strong> {showPaymentProof.email}</p>
                    <p className="text-xs sm:text-sm text-text-secondary"><strong className="text-text-primary">Phone:</strong> {showPaymentProof.phone}</p>
                  </div>
                </div>

                {showPaymentProof.paymentProof && (
                  <>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-text-primary mb-2 sm:mb-3">Transaction Details</h3>
                      <div className="bg-background rounded-lg sm:rounded-xl p-3 sm:p-4 border border-fest-border space-y-2">
                        <p className="text-xs sm:text-sm text-text-secondary"><strong className="text-text-primary">Transaction ID:</strong> {showPaymentProof.paymentProof.transactionId}</p>
                        <p className="text-xs sm:text-sm text-text-secondary">
                          <strong className="text-text-primary">Status:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs sm:text-sm ${
                            showPaymentProof.paymentProof.paymentStatus === 'verified' 
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30'
                              : showPaymentProof.paymentProof.paymentStatus === 'rejected'
                              ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {showPaymentProof.paymentProof.paymentStatus}
                          </span>
                        </p>
                        <p className="text-xs sm:text-sm text-text-secondary"><strong className="text-text-primary">Submitted:</strong> {new Date(showPaymentProof.paymentProof.submittedAt).toLocaleString()}</p>
                        {showPaymentProof.paymentProof.rejectionReason && (
                          <p className="text-xs sm:text-sm text-red-400 mt-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                            <strong>Rejection Reason:</strong> {showPaymentProof.paymentProof.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-text-primary mb-2 sm:mb-3">Payment Screenshot</h3>
                      <div className="border border-fest-border rounded-lg sm:rounded-xl p-2 sm:p-4 bg-background">
                        <img
                          src={showPaymentProof.paymentProof.screenshotURL}
                          alt="Payment proof"
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    </div>

                    {showPaymentProof.paymentProof.paymentStatus === 'pending_verification' && (
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 border-t border-fest-border">
                        <button
                          onClick={() => {
                            handleVerifyPayment(showPaymentProof.id, showPaymentProof);
                            setShowPaymentProof(null);
                          }}
                          disabled={verifyingPayment}
                          className="btn-primary flex-1 disabled:opacity-50 text-sm sm:text-base py-2 sm:py-2.5"
                        >
                          Verify Payment
                        </button>
                        <button
                          onClick={() => {
                            handleRejectPayment(showPaymentProof.id);
                            setShowPaymentProof(null);
                          }}
                          disabled={verifyingPayment}
                          className="btn-danger flex-1 disabled:opacity-50 text-sm sm:text-base py-2 sm:py-2.5"
                        >
                          Reject Payment
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageFest;

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { currentUser, userRole } = useAuth();
  const [data, setData] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [userRole]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (userRole === 'student') {
        // Fetch user profile data
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
        
        // Fetch student registrations
        const registrationsQuery = query(
          collection(db, 'registrations'),
          where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(registrationsQuery);
        const registrations = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(registrations);
      } else if (userRole === 'organizer') {
        // Fetch organizer's fests
        const festsQuery = query(
          collection(db, 'fests'),
          where('createdBy', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(festsQuery);
        const fests = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(fests);

        // Fetch registrations for organizer's fests
        if (fests.length > 0) {
          const festIds = fests.map(f => f.id);
          const registrationsQuery = query(
            collection(db, 'registrations')
          );
          const regsSnapshot = await getDocs(registrationsQuery);
          const allRegistrations = regsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Filter registrations for this organizer's fests
          const filteredRegs = allRegistrations.filter(reg => 
            festIds.includes(reg.festId)
          );
          
          console.log('Organizer registrations:', filteredRegs);
          setRegistrations(filteredRegs);
        }
      } else if (userRole === 'admin') {
        // Fetch all pending fests for approval
        const festsQuery = query(
          collection(db, 'fests'),
          where('status', '==', 'pending')
        );
        const querySnapshot = await getDocs(festsQuery);
        const fests = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(fests);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveFest = async (festId) => {
    try {
      await updateDoc(doc(db, 'fests', festId), {
        status: 'published',
        approvedAt: new Date().toISOString()
      });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error approving fest:', error);
    }
  };

  const handleRejectFest = async (festId) => {
    if (window.confirm('Are you sure you want to reject this fest?')) {
      try {
        await deleteDoc(doc(db, 'fests', festId));
        fetchDashboardData(); // Refresh data
      } catch (error) {
        console.error('Error rejecting fest:', error);
      }
    }
  };

  const handleDeleteFest = async (festId) => {
    if (window.confirm('Are you sure you want to delete this fest?')) {
      try {
        await deleteDoc(doc(db, 'fests', festId));
        fetchDashboardData(); // Refresh data
      } catch (error) {
        console.error('Error deleting fest:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-primary mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Student Dashboard */}
        {userRole === 'student' && (
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">My Registrations</h1>
            
            {/* Profile completion reminder - only show if profile is incomplete */}
            {(!userProfile?.phone || !userProfile?.college) && (
              <div className="mb-4 sm:mb-6 glass-container p-4 sm:p-6 border-l-4 border-primary">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-white">Complete Your Profile</h3>
                    <div className="mt-2 text-xs sm:text-sm text-gray-300">
                      <p>
                        Make sure your profile has your phone number and college details before registering for fests. 
                        Organizers need this information to contact you.
                      </p>
                    </div>
                    <div className="mt-3">
                      <Link
                        to="/profile"
                        className="text-sm font-medium text-primary hover:text-orange-400 underline transition-colors"
                      >
                        Update Profile →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {data.length === 0 ? (
              <div className="glass-container p-12 text-center">
                <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">You haven't registered for any fests yet</p>
                <Link to="/" className="btn-primary px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base">
                  Browse Fests
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {data.map(registration => (
                  <div key={registration.id} className="card p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                      {registration.festName}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-300 mb-2">{registration.collegeName}</p>
                    <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
                      Registered: {new Date(registration.registeredAt).toLocaleDateString()}
                    </p>
                    <Link
                      to={`/fest/${registration.festId}`}
                      className="btn-primary w-full text-center block px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Organizer Dashboard */}
        {userRole === 'organizer' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">My Fests</h1>
              <Link to="/create-fest" className="btn-primary px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base">
                + Create New Fest
              </Link>
            </div>
            {data.length === 0 ? (
              <div className="glass-container p-6 sm:p-12 text-center">
                <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">You haven't created any fests yet</p>
                <Link to="/create-fest" className="btn-primary px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base">
                  Create Your First Fest
                </Link>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {data.map(fest => (
                  <div key={fest.id} className="glass-container p-4 sm:p-6">{/* Admin Comment Alert - Show for changes_requested or rejected */}
                    {/* Admin Comment Alert - Show for changes_requested or rejected */}
                    {fest.adminComments && (fest.status === 'changes_requested' || fest.status === 'rejected') && (
                      <div className={`mb-3 sm:mb-4 p-3 sm:p-4 rounded-2xl border-l-4 bg-white/5 backdrop-blur ${
                        fest.status === 'changes_requested' 
                          ? 'border-orange-500' 
                          : 'border-red-500'
                      }`}>
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            {fest.status === 'changes_requested' ? (
                              <span className="text-2xl">📝</span>
                            ) : (
                              <span className="text-2xl">⚠️</span>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <h4 className={`text-sm font-semibold ${
                              fest.status === 'changes_requested' 
                                ? 'text-orange-300' 
                                : 'text-red-300'
                            }`}>
                              {fest.status === 'changes_requested' ? 'Changes Requested by Admin' : 'Fest Rejected by Admin'}
                            </h4>
                            <p className={`mt-1 text-sm ${
                              fest.status === 'changes_requested' 
                                ? 'text-orange-200' 
                                : 'text-red-200'
                            }`}>
                              {fest.adminComments}
                            </p>
                            {fest.status === 'changes_requested' && (
                              <p className="mt-2 text-xs text-orange-400">
                                Please edit your fest to address the admin's feedback and resubmit for approval.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                      <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                          <h3 className="text-xl sm:text-2xl font-bold text-white">
                            {fest.festName}
                          </h3>
                          <span className={`badge ${
                            fest.status === 'published' || fest.status === 'approved'
                              ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                              : fest.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                              : fest.status === 'changes_requested'
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                              : 'bg-red-500/20 text-red-300 border-red-500/30'
                          }`}>
                            {fest.status === 'changes_requested' ? 'CHANGES REQUESTED' : fest.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base text-gray-300 mb-2 font-medium">{fest.collegeName}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400 mb-3">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(fest.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {fest.venue || fest.location || 'Venue TBA'}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base text-gray-400 line-clamp-2">{fest.description}</p>
                      </div>
                      <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto sm:ml-4 flex-shrink-0">
                        {(fest.status === 'published' || fest.status === 'approved') && (
                          <>
                            <Link
                              to={`/fest/${fest.id}/manage`}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-full text-xs sm:text-sm transition-all"
                            >
                              Manage
                            </Link>
                          </>
                        )}
                        {fest.status === 'changes_requested' && (
                          <Link
                            to={`/fest/${fest.id}/edit`}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-full text-xs sm:text-sm inline-flex items-center gap-1 transition-all"
                          >
                            Edit & Resubmit
                          </Link>
                        )}
                        <button
                          onClick={() => handleDeleteFest(fest.id)}
                          className="btn-danger text-xs sm:text-sm px-3 sm:px-4 py-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin Dashboard */}
        {userRole === 'admin' && (
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">Fest Approvals</h1>
            {data.length === 0 ? (
              <div className="glass-container p-6 sm:p-12 text-center">
                <p className="text-sm sm:text-base text-gray-400">No pending fests for approval</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {data.map(fest => (
                  <div key={fest.id} className="glass-container p-4 sm:p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                          {fest.festName}
                        </h3>
                        <div className="space-y-2 mb-3 sm:mb-4">
                          <p className="text-sm sm:text-base text-gray-300">
                            <span className="font-semibold text-white">College:</span> {fest.collegeName}
                          </p>
                          <p className="text-sm sm:text-base text-gray-300">
                            <span className="font-semibold text-white">Category:</span> 
                            <span className={`ml-2 badge ${
                              fest.category === 'Technical' ? 'badge-tech' :
                              fest.category === 'Cultural' ? 'badge-culture' :
                              'badge-sports'
                            }`}>{fest.category}</span>
                          </p>
                          <p className="text-sm sm:text-base text-gray-300">
                            <span className="font-semibold text-white">Date:</span> {new Date(fest.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm sm:text-base text-gray-300">
                            <span className="font-semibold text-white">Venue:</span> {fest.venue || fest.location || 'Not specified'}
                          </p>
                        </div>
                        <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{fest.description}</p>
                        {fest.bannerUrl && (
                          <div className="mt-3 sm:mt-4">
                            <img
                              src={fest.bannerUrl}
                              alt={fest.festName}
                              className="w-full h-32 sm:h-48 object-cover rounded-2xl"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
                      <button
                        onClick={() => handleApproveFest(fest.id)}
                        className="btn-primary flex-1 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectFest(fest.id)}
                        className="btn-danger flex-1 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

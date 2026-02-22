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
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Student Dashboard */}
        {userRole === 'student' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">My Registrations</h1>
            
            {/* Profile completion reminder - only show if profile is incomplete */}
            {(!userProfile?.phone || !userProfile?.college) && (
              <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-blue-800">Complete Your Profile</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Make sure your profile has your phone number and college details before registering for fests. 
                        Organizers need this information to contact you.
                      </p>
                    </div>
                    <div className="mt-3">
                      <Link
                        to="/profile"
                        className="text-sm font-medium text-blue-800 hover:text-blue-900 underline"
                      >
                        Update Profile →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {data.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-600 mb-4">You haven't registered for any fests yet</p>
                <Link to="/" className="btn-primary">
                  Browse Fests
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map(registration => (
                  <div key={registration.id} className="card">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {registration.festName}
                    </h3>
                    <p className="text-gray-600 mb-2">{registration.collegeName}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Registered on: {new Date(registration.registeredAt).toLocaleDateString()}
                    </p>
                    <Link
                      to={`/fest/${registration.festId}`}
                      className="btn-primary w-full text-center block"
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
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">My Fests</h1>
              <Link to="/create-fest" className="btn-primary">
                + Create New Fest
              </Link>
            </div>
            {data.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-600 mb-4">You haven't created any fests yet</p>
                <Link to="/create-fest" className="btn-primary">
                  Create Your First Fest
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {data.map(fest => (
                  <div key={fest.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-800">
                            {fest.festName}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            fest.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : fest.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {fest.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-1">{fest.collegeName}</p>
                        <p className="text-sm text-gray-500 mb-2">
                          📅 {new Date(fest.date).toLocaleDateString()} | 📍 {fest.venue || fest.location || 'Venue TBA'}
                        </p>
                        <p className="text-gray-700 line-clamp-2">{fest.description}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {fest.status === 'published' && (
                          <Link
                            to={`/fest/${fest.id}`}
                            className="btn-secondary text-sm"
                          >
                            View
                          </Link>
                        )}
                        <button
                          onClick={() => handleDeleteFest(fest.id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Registrations Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Student Registrations</h2>
              {registrations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-600">No student registrations yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.map(fest => {
                    const festRegistrations = registrations.filter(reg => reg.festId === fest.id);
                    if (festRegistrations.length === 0) return null;
                    
                    return (
                      <div key={fest.id} className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                          {fest.festName} - {festRegistrations.length} {festRegistrations.length === 1 ? 'Registration' : 'Registrations'}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Student Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Phone
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  College
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Registered At
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {festRegistrations.map((reg) => (
                                <tr key={reg.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {reg.studentName}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {reg.studentEmail}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {reg.studentPhone}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {reg.studentCollege}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {new Date(reg.registeredAt).toLocaleDateString('en-IN', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Dashboard */}
        {userRole === 'admin' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Fest Approvals</h1>
            {data.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-600">No pending fests for approval</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.map(fest => (
                  <div key={fest.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {fest.festName}
                        </h3>
                        <p className="text-gray-600 mb-1">
                          <span className="font-semibold">College:</span> {fest.collegeName}
                        </p>
                        <p className="text-gray-600 mb-1">
                          <span className="font-semibold">Category:</span> {fest.category}
                        </p>
                        <p className="text-gray-600 mb-1">
                          <span className="font-semibold">Date:</span> {new Date(fest.date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600 mb-1">
                          <span className="font-semibold">Venue:</span> {fest.venue || fest.location || 'Not specified'}
                        </p>
                        <p className="text-gray-700 mt-3">{fest.description}</p>
                        {fest.bannerUrl && (
                          <div className="mt-4">
                            <img
                              src={fest.bannerUrl}
                              alt={fest.festName}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => handleApproveFest(fest.id)}
                        className="btn-primary flex-1"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleRejectFest(fest.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg flex-1"
                      >
                        ✗ Reject
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

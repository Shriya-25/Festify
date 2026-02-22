import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const StudentProfile = () => {
  const { userId } = useParams();
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProfile();
  }, [userId]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);

      // Fetch student profile
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        alert('Student not found');
        navigate(-1);
        return;
      }

      const studentData = { id: userDoc.id, ...userDoc.data() };
      
      // Verify this is a student profile
      if (studentData.role !== 'student') {
        alert('Invalid profile');
        navigate(-1);
        return;
      }

      setStudent(studentData);

      // If organizer, verify they have access (student registered in their fest)
      if (userRole === 'organizer') {
        // Fetch organizer's fests
        const festsQuery = query(
          collection(db, 'fests'),
          where('createdBy', '==', currentUser.uid)
        );
        const festsSnapshot = await getDocs(festsQuery);
        const festIds = festsSnapshot.docs.map(doc => doc.id);

        // Fetch events for these fests
        const eventsQuery = query(
          collection(db, 'events'),
          where('festId', 'in', festIds)
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventIds = eventsSnapshot.docs.map(doc => doc.id);

        // Check if student registered in any of these events
        const regsQuery = query(
          collection(db, 'eventRegistrations'),
          where('userId', '==', userId)
        );
        const regsSnapshot = await getDocs(regsQuery);
        const studentRegs = regsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const hasAccess = studentRegs.some(reg => eventIds.includes(reg.eventId));
        
        if (!hasAccess) {
          alert('You do not have permission to view this profile');
          navigate(-1);
          return;
        }

        // Get registrations for display
        const relevantRegs = studentRegs.filter(reg => eventIds.includes(reg.eventId));
        setRegistrations(relevantRegs);
      }

    } catch (error) {
      console.error('Error fetching student profile:', error);
      alert('Error loading profile');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 sm:mb-6 text-primary hover:text-primary/80 inline-flex items-center gap-2 transition-colors text-sm sm:text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Profile Card */}
        <div className="glass-container border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-orange-600 px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white border-2 border-white/30">
                {student.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="text-white">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{student.name}</h1>
                <p className="text-sm sm:text-base text-white/80">Student Profile</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="mb-4 sm:mb-6">
              <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold border border-blue-500/30">
                View-Only Access
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label className="label text-sm sm:text-base">
                  Email Address
                </label>
                <div className="p-2 sm:p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm sm:text-base text-white">{student.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="label text-sm sm:text-base">
                  Phone Number
                </label>
                <div className="p-2 sm:p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm sm:text-base text-white">{student.phone || 'Not provided'}</p>
                </div>
              </div>

              {/* College */}
              <div>
                <label className="label text-sm sm:text-base">
                  College/University
                </label>
                <div className="p-2 sm:p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm sm:text-base text-white">{student.college || 'Not provided'}</p>
                </div>
              </div>

              {/* Branch */}
              <div>
                <label className="label text-sm sm:text-base">
                  Branch
                </label>
                <div className="p-2 sm:p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm sm:text-base text-white">{student.branch || 'Not provided'}</p>
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="label text-sm sm:text-base">
                  Year
                </label>
                <div className="p-2 sm:p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm sm:text-base text-white">{student.year || 'Not provided'}</p>
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="label text-sm sm:text-base">
                  Gender
                </label>
                <div className="p-2 sm:p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm sm:text-base text-white">{student.gender || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Registrations (for organizers) */}
            {userRole === 'organizer' && registrations.length > 0 && (
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                  Event Registrations ({registrations.length})
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  {registrations.map(reg => (
                    <div key={reg.id} className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="text-sm sm:text-base font-semibold text-white">{reg.eventName}</h3>
                      <p className="text-xs sm:text-sm text-gray-300">{reg.festName}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Registered: {new Date(reg.registeredAt).toLocaleString()}
                      </p>
                      {reg.customFields && Object.keys(reg.customFields).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-xs font-semibold text-gray-300 mb-2">Form Responses:</p>
                          <div className="space-y-1">
                            {Object.entries(reg.customFields).map(([key, value]) => (
                              <p key={key} className="text-sm text-gray-300">
                                <span className="font-medium text-white">{key}:</span> {String(value)}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Note for Organizers */}
        {userRole === 'organizer' && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p className="text-sm text-blue-400">
              <strong>Note:</strong> You can view this profile because this student registered for your event. 
              You cannot edit their information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;

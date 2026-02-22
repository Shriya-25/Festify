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
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-primary hover:underline"
        >
          ← Back
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-blue-600 px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-primary">
                {student.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">{student.name}</h1>
                <p className="text-blue-100">Student Profile</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-8 py-6">
            <div className="mb-6">
              <div className="inline-block px-3 py-1 bg-blue-100 text-primary rounded-full text-sm font-semibold">
                🔒 View-Only Access
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Email Address
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-800">📧 {student.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Phone Number
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-800">📱 {student.phone || 'Not provided'}</p>
                </div>
              </div>

              {/* College */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  College/University
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-800">🏫 {student.college || 'Not provided'}</p>
                </div>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Branch
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-800">📚 {student.branch || 'Not provided'}</p>
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Year
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-800">📅 {student.year || 'Not provided'}</p>
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Gender
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-800">👤 {student.gender || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Registrations (for organizers) */}
            {userRole === 'organizer' && registrations.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Event Registrations ({registrations.length})
                </h2>
                <div className="space-y-3">
                  {registrations.map(reg => (
                    <div key={reg.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-800">{reg.eventName}</h3>
                      <p className="text-sm text-gray-600">{reg.festName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Registered: {new Date(reg.registeredAt).toLocaleString()}
                      </p>
                      {reg.customFields && Object.keys(reg.customFields).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Form Responses:</p>
                          <div className="space-y-1">
                            {Object.entries(reg.customFields).map(([key, value]) => (
                              <p key={key} className="text-sm text-gray-700">
                                <span className="font-medium">{key}:</span> {String(value)}
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
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
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

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const EventDetails = () => {
  const { eventId } = useParams();
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [message, setMessage] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchEventDetails();
    if (currentUser) {
      checkRegistrationStatus();
    }
  }, [eventId, currentUser]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        const eventData = { id: eventDoc.id, ...eventDoc.data() };
        
        // Check if event is approved (unless user is organizer who created it)
        if (eventData.status !== 'approved' && eventData.createdBy !== currentUser?.uid) {
          navigate('/');
          return;
        }
        
        setEvent(eventData);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      const regsQuery = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(regsQuery);
      setIsRegistered(!querySnapshot.empty);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const isRegistrationOpen = () => {
    if (!event) return false;
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);
    return now < deadline &&
(!event.maxParticipants || event.participantCount < event.maxParticipants);
  };

  const openRegistrationModal = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!currentUser.emailVerified && currentUser.providerData[0]?.providerId === 'password') {
      setMessage('Please verify your email before registering');
      setTimeout(() => navigate('/verify-email'), 2000);
      return;
    }

    // Verify user role from database
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (!userDoc.exists()) {
        setMessage('User profile not found. Please complete your profile first.');
        setTimeout(() => navigate('/profile'), 2000);
        return;
      }

      const userData = userDoc.data();
      
      if (userData.role !== 'student') {
        setMessage('Only students can register for events');
        return;
      }

      if (!isRegistrationOpen()) {
        setMessage('Registration is closed for this event');
        return;
      }

      // Initialize form data
      const initialFormData = {};
      
      if (event.prefillUserData) {
        initialFormData.name = userData?.name || currentUser.displayName || '';
        initialFormData.email = userData?.email || currentUser.email || '';
        initialFormData.phone = userData?.phone || '';
        initialFormData.college = userData?.college || '';
        initialFormData.branch = userData?.branch || '';
        initialFormData.year = userData?.year || '';
        initialFormData.gender = userData?.gender || '';
      }

      if (event.registrationForm && event.registrationForm.length > 0) {
        event.registrationForm.forEach(field => {
          initialFormData[field.id] = field.type === 'checkbox' ? false : '';
        });
      }

      setFormData(initialFormData);
      setShowRegistrationModal(true);
      setMessage('');
    } catch (error) {
      console.error('Error opening registration modal:', error);
      setMessage('Error loading registration form. Please try again.');
    }
  };

  const handleFormChange = (e, fieldId) => {
    const { type, value, checked, files } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [fieldId]: checked });
    } else if (type === 'file') {
      setFormData({ ...formData, [fieldId]: files[0] });
    } else {
      setFormData({ ...formData, [fieldId]: value });
    }
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();

    // Check deadline again (backend validation)
    if (!isRegistrationOpen()) {
      setMessage('Registration deadline has passed or event is full');
      return;
    }

    try {
      setRegistering(true);
      setMessage('');

      console.log('Starting registration...', {
        eventId,
        eventData: event,
        formData,
        currentUser: currentUser.uid
      });

      const registrationData = {
        eventId: eventId,
        festId: event.festId,
        userId: currentUser.uid,
        eventName: event.eventName,
        festName: event.festName,
        registeredAt: new Date().toISOString()
      };

      if (event.prefillUserData) {
        registrationData.name = formData.name;
        registrationData.email = formData.email;
        registrationData.phone = formData.phone;
        registrationData.college = formData.college;
        registrationData.branch = formData.branch || '';
        registrationData.year = formData.year || '';
        registrationData.gender = formData.gender || '';
      }

      if (event.registrationForm && event.registrationForm.length > 0) {
        const customResponses = {};
        event.registrationForm.forEach(field => {
          if (field.type === 'file' && formData[field.id]) {
            customResponses[field.label] = formData[field.id].name;
          } else {
            customResponses[field.label] = formData[field.id] || '';
          }
        });
        registrationData.customFields = customResponses;
      }

      console.log('Registration data to submit:', registrationData);

      await addDoc(collection(db, 'eventRegistrations'), registrationData);

      console.log('Registration document created successfully');

      // Update participant count
      await updateDoc(doc(db, 'events', eventId), {
        participantCount: increment(1)
      });
      
      console.log('Participant count updated');

      setIsRegistered(true);
      setShowRegistrationModal(false);
      setMessage('🎉 Successfully registered for the event!');
      
      //Refresh event data
      fetchEventDetails();
    } catch (error) {
      console.error('Error registering:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to register. Please try again.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please ensure you have a student account and your profile is complete.';
      } else if (error.message) {
        errorMessage = `Failed to register: ${error.message}`;
      }
      
      setMessage(errorMessage);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const registrationStatus = !isRegistrationOpen() ? 'closed' : isRegistered ? 'registered' : 'open';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Image */}
        {event.bannerUrl && (
          <div className="mb-6">
            <img
              src={event.bannerUrl}
              alt={event.eventName}
              className="w-full h-64 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Event Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{event.eventName}</h1>
              <p className="text-xl text-gray-600">{event.festName}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                registrationStatus === 'closed' 
                  ? 'bg-red-100 text-red-800'
                  : registrationStatus === 'registered'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-primary'
              }`}>
                {registrationStatus === 'closed' ? '🔒 Registrations Closed' 
                  : registrationStatus === 'registered' ? '✓ Registered' 
                  : '🎯 Open for Registration'}
              </span>
              <div className="mt-2">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                  {event.domain}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 mb-1">📅 Date & Time</p>
              <p className="font-semibold text-gray-800">
                {new Date(event.date).toLocaleDateString()} at {event.time}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">📍 Venue</p>
              <p className="font-semibold text-gray-800">{event.venue}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">💰 Entry Fees</p>
              <p className="font-semibold text-gray-800">
                {event.fees > 0 ? `₹${event.fees}` : 'Free'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">👥 Participants</p>
              <p className="font-semibold text-gray-800">
                {event.participantCount || 0}
                {event.maxParticipants && ` / ${event.maxParticipants}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">⏰ Registration Deadline</p>
              <p className="font-semibold text-gray-800">
                {new Date(event.registrationDeadline).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">About This Event</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Registration Section */}
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.includes('Success') || message.includes('🎉') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div>
            {!currentUser ? (
              <button onClick={() => navigate('/login')} className="btn-primary w-full">
                Login to Register
              </button>
            ) : !isRegistrationOpen() ? (
              <button disabled className="w-full bg-red-500 text-white font-semibold py-3 px-6 rounded-lg cursor-not-allowed">
                🔒 Registration Closed
              </button>
            ) : isRegistered ? (
              <button disabled className="w-full bg-green-500 text-white font-semibold py-3 px-6 rounded-lg">
                ✓ Already Registered
              </button>
            ) : userRole === 'student' ? (
              <button
                onClick={openRegistrationModal}
                className="btn-primary w-full"
              >
                Register for this Event
              </button>
            ) : (
              <div className="text-center text-gray-600">
                Only students can register for events
              </div>
            )}
          </div>
        </div>

        {/* Registration Modal */}
        {showRegistrationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  Registration Form - {event.eventName}
                </h2>
                <button
                  onClick={() => setShowRegistrationModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitRegistration} className="p-6 space-y-4">
                {event.prefillUserData && (
                  <div className="space-y-4 pb-4 border-b">
                    <h3 className="font-semibold text-gray-700">Basic Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => handleFormChange(e, 'name')}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Email <span className="text-red-500">*</span></label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleFormChange(e, 'email')}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Phone <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => handleFormChange(e, 'phone')}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">College <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={formData.college || ''}
                          onChange={(e) => handleFormChange(e, 'college')}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Branch</label>
                        <input
                          type="text"
                          value={formData.branch || ''}
                          onChange={(e) => handleFormChange(e, 'branch')}
                          className="input-field"
                          placeholder="e.g., Computer Science"
                        />
                      </div>
                      <div>
                        <label className="label">Year</label>
                        <select
                          value={formData.year || ''}
                          onChange={(e) => handleFormChange(e, 'year')}
                          className="input-field"
                        >
                          <option value="">Select Year</option>
                          <option>1st Year</option>
                          <option>2nd Year</option>
                          <option>3rd Year</option>
                          <option>4th Year</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Gender</label>
                        <select
                          value={formData.gender || ''}
                          onChange={(e) => handleFormChange(e, 'gender')}
                          className="input-field"
                        >
                          <option value="">Select Gender</option>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                          <option>Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Fields */}
                {event.registrationForm && event.registrationForm.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Additional Information</h3>
                    
                    {event.registrationForm.map((field) => (
                      <div key={field.id}>
                        <label className="label">
                          {field.label}
                          {field.required && <span className="text-red-500"> *</span>}
                        </label>

                        {['text', 'email', 'phone', 'number'].includes(field.type) && (
                          <input
                            type={field.type}
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormChange(e, field.id)}
                            placeholder={field.placeholder}
                            className="input-field"
                            required={field.required}
                          />
                        )}

                        {field.type === 'date' && (
                          <input
                            type="date"
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormChange(e, field.id)}
                            className="input-field"
                            required={field.required}
                          />
                        )}

                        {field.type === 'textarea' && (
                          <textarea
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormChange(e, field.id)}
                            placeholder={field.placeholder}
                            rows="4"
                            className="input-field"
                            required={field.required}
                          />
                        )}

                        {field.type === 'dropdown' && (
                          <select
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormChange(e, field.id)}
                            className="input-field"
                            required={field.required}
                          >
                            <option value="">Select an option</option>
                            {field.options?.map((option, idx) => (
                              <option key={idx} value={option}>{option}</option>
                            ))}
                          </select>
                        )}

                        {field.type === 'radio' && (
                          <div className="space-y-2">
                            {field.options?.map((option, idx) => (
                              <label key={idx} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`field-${field.id}`}
                                  value={option}
                                  checked={formData[field.id] === option}
                                  onChange={(e) => handleFormChange(e, field.id)}
                                  required={field.required}
                                  className="w-4 h-4"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {field.type === 'checkbox' && (
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData[field.id] || false}
                              onChange={(e) => handleFormChange(e, field.id)}
                              required={field.required}
                              className="w-4 h-4"
                            />
                            <span>{field.placeholder || 'I agree'}</span>
                          </label>
                        )}

                        {field.type === 'file' && (
                          <input
                            type="file"
                            onChange={(e) => handleFormChange(e, field.id)}
                            className="input-field"
                            required={field.required}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 flex space-x-4">
                  <button
                    type="submit"
                    disabled={registering}
                    className="btn-primary flex-1"
                  >
                    {registering ? 'Submitting...' : 'Submit Registration'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRegistrationModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate(`/fest/${event.festId}`)}
          className="btn-secondary"
        >
          ← Back to Fest
        </button>
      </div>
    </div>
  );
};

export default EventDetails;
